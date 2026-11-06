
import { Hono } from "hono";
import { z } from "zod";
import {
  explanationRequestSchema,
  explanationSchema,
  nasaTags,
} from "@shared/schemas/nasa";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { createAdminClient } from "../lib/supabase";

const NASA_URL = "https://api.nasa.gov/planetary/apod";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

const pictureSchema = z.object({
  date: z.iso.date(),
  title: z.string(),
  explanation: z.string(),
  media_type: z.string(),
  url: z.string().optional(),
  hdurl: z.string().nullish(),
});

type NasaPicture = z.infer<typeof pictureSchema>;

const countSchema = z.coerce.number().int().min(1).max(20);

const explanationColumns =
  "date, hebrew_title, hebrew_summary, tags, created_at";

function createNasaUrl(
  apiKey: string,
  params: Record<string, string>,
): URL {
  const url = new URL(NASA_URL);
  url.searchParams.set("api_key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

function isValidPicture(picture: NasaPicture): boolean {
  if (picture.media_type !== "image" || !picture.hdurl) {
    return false;
  }

  if (picture.title.trim().toLowerCase() === "nasa science") {
    return false;
  }

  try {
    const imageUrl = new URL(picture.hdurl);

    return (
      imageUrl.protocol === "https:" &&
      !imageUrl.pathname.toLowerCase().includes("nasa-logo")
    );
  } catch {
    return false;
  }
}

async function fetchNasa(
  apiKey: string,
  params: Record<string, string>,
): Promise<unknown> {
  const response = await fetch(createNasaUrl(apiKey, params));

  if (!response.ok) {
    console.error("NASA API error:", response.status);
    throw new Error(`NASA returned ${response.status}`);
  }

  return response.json();
}

export const nasa = new Hono<AppEnv>()
  .get("/pictures", async (c) => {
    const count = countSchema.safeParse(
      c.req.query("count") ?? "10",
    );

    if (!count.success) {
      return fail(
        c,
        400,
        "invalid_input",
        "Count must be between 1 and 20.",
      );
    }

    try {
      // NASA chooses random APOD dates when count is provided.
      const raw = await fetchNasa(c.env.NASA_API_KEY, {
        count: "25",
      });

      const parsed = z.array(pictureSchema).safeParse(raw);

      if (!parsed.success) {
        console.error("Invalid NASA response:", parsed.error);

        return fail(
          c,
          502,
          "nasa_error",
          "NASA returned invalid data.",
        );
      }

      const pictures = parsed.data
        .filter(isValidPicture)
        .slice(0, count.data)
        .map((picture) => ({
          date: picture.date,
          title: picture.title,
          explanation: picture.explanation,
          media_type: picture.media_type,
          url: picture.hdurl!,
        }));

      if (pictures.length === 0) {
        console.error("NASA returned no usable pictures.");

        return fail(
          c,
          502,
          "nasa_error",
          "NASA is not returning usable space pictures right now.",
        );
      }

      return c.json(pictures);
    } catch (error) {
      console.error("NASA pictures request failed:", error);

      return fail(
        c,
        502,
        "nasa_error",
        "Could not load NASA pictures.",
      );
    }
  })
  .post(
    "/explanations",
    validate("json", explanationRequestSchema),
    async (c) => {
      const { date } = c.req.valid("json");
      const supabase = createAdminClient(c.env);

      // Check the cache before calling Gemini.
      const { data: cached, error: cacheError } = await supabase
        .from("nasa_explanations")
        .select(explanationColumns)
        .eq("date", date)
        .maybeSingle();

      if (cacheError) {
        console.error("Cache lookup failed:", cacheError);

        return fail(
          c,
          500,
          "database_error",
          "Could not check saved explanations.",
        );
      }

      if (cached) {
        return c.json(cached);
      }

      // Fetch the original NASA description using only the date.
      let picture: NasaPicture;

      try {
        const raw = await fetchNasa(c.env.NASA_API_KEY, {
          date,
        });

        const parsed = pictureSchema.safeParse(raw);

        if (!parsed.success || !isValidPicture(parsed.data)) {
          return fail(
            c,
            502,
            "nasa_error",
            "NASA did not return a valid picture for this date.",
          );
        }

        picture = parsed.data;
      } catch (error) {
        console.error("NASA date lookup failed:", error);

        return fail(
          c,
          502,
          "nasa_error",
          "Could not load the NASA picture.",
        );
      }

      // Generate a Hebrew explanation using Gemini Flash.
      let explanation: z.infer<typeof explanationSchema>;

      try {
        const response = await fetch(GEMINI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": c.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Explain this NASA Astronomy Picture of the Day in Hebrew.

NASA title: ${picture.title}
NASA description: ${picture.explanation}

Requirements:
- hebrew_title: a short Hebrew title.
- hebrew_summary: 2-3 simple Hebrew sentences suitable for a 10-year-old child.
- tags: 1-5 relevant tags from: ${nasaTags.join(", ")}.

Explain the specific astronomical objects or events described by NASA.
Use the NASA description as the source of facts.
Do not invent details or write a generic introduction about NASA.
Return only the requested JSON.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  hebrew_title: {
                    type: "STRING",
                  },
                  hebrew_summary: {
                    type: "STRING",
                  },
                  tags: {
                    type: "ARRAY",
                    items: {
                      type: "STRING",
                      enum: [...nasaTags],
                    },
                    minItems: 1,
                    maxItems: 5,
                  },
                },
                required: [
                  "hebrew_title",
                  "hebrew_summary",
                  "tags",
                ],
              },
            },
          }),
        });

        if (!response.ok) {
          console.error(
            "Gemini API failed:",
            response.status,
            await response.text(),
          );

          return fail(
            c,
            502,
            "gemini_error",
            "Could not generate an explanation.",
          );
        }

        const result = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };

        const text =
          result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          return fail(
            c,
            502,
            "gemini_error",
            "Gemini returned no explanation.",
          );
        }

        const parsed = explanationSchema.safeParse(
          JSON.parse(text),
        );

        if (!parsed.success) {
          console.error("Invalid Gemini response:", parsed.error);

          return fail(
            c,
            502,
            "gemini_error",
            "Gemini returned an invalid explanation.",
          );
        }

        explanation = parsed.data;
      } catch (error) {
        console.error("Gemini request failed:", error);

        return fail(
          c,
          502,
          "gemini_error",
          "Could not process Gemini's response.",
        );
      }

      // Save by APOD date without overwriting an existing result.
      const { data: saved, error: saveError } = await supabase
        .from("nasa_explanations")
        .upsert(
          { date, ...explanation },
          {
            onConflict: "date",
            ignoreDuplicates: true,
          },
        )
        .select(explanationColumns)
        .maybeSingle();

      if (saveError) {
        console.error("Saving explanation failed:", saveError);

        return fail(
          c,
          500,
          "database_error",
          "Could not save the explanation.",
        );
      }

      if (saved) {
        return c.json(saved);
      }

      const { data: existing, error: readError } = await supabase
        .from("nasa_explanations")
        .select(explanationColumns)
        .eq("date", date)
        .single();

      if (readError || !existing) {
        return fail(
          c,
          500,
          "database_error",
          "Could not load the saved explanation.",
        );
      }

      return c.json(existing);
    },
  );
