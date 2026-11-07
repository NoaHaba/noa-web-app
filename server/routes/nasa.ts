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

const NASA_URL =
  "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

const pictureSchema = z.object({
  date: z.iso.date(),
  title: z.string(),
  explanation: z.string(),
  media_type: z.string(),
  hdurl: z.string().nullish(),
});

type NasaPicture = z.infer<typeof pictureSchema>;

const countSchema = z.coerce.number().int().min(1).max(20);

const explanationColumns =
  "date, hebrew_title, hebrew_summary, tags, created_at";

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidPicture(
  picture: NasaPicture,
): picture is NasaPicture & { hdurl: string } {
  if (
    picture.media_type !== "image" ||
    !picture.hdurl ||
    picture.title.trim().toLowerCase() === "nasa science"
  ) {
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

async function fetchNasa(): Promise<NasaPicture[]> {
  const response = await fetch(NASA_URL);

  if (!response.ok) {
    throw new Error(`NASA returned ${response.status}`);
  }

  const raw: unknown = await response.json();
  const items = Array.isArray(raw) ? raw : [raw];

  return z.array(pictureSchema).parse(items);
}

function getUniquePictures(
  pictures: NasaPicture[],
): Array<NasaPicture & { hdurl: string }> {
  const unique = new Map<
    string,
    NasaPicture & { hdurl: string }
  >();

  for (const picture of pictures) {
    if (isValidPicture(picture)) {
      unique.set(picture.date, picture);
    }
  }

  return [...unique.values()];
}

function shufflePictures<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
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
      const results = await fetchNasa();

      const pictures = shufflePictures(
        getUniquePictures(results),
      )
        .slice(0, count.data)
        .map((picture) => ({
          date: picture.date,
          title: picture.title,
          explanation: cleanHtml(picture.explanation),
          media_type: picture.media_type,
          url: picture.hdurl,
        }));

      if (pictures.length === 0) {
        return fail(
          c,
          502,
          "nasa_error",
          "Could not load NASA pictures.",
        );
      }

      return c.json(pictures);
    } catch {
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

      // Return an existing explanation without calling Gemini.
      const { data: cached, error: cacheError } = await supabase
        .from("nasa_explanations")
        .select(explanationColumns)
        .eq("date", date)
        .maybeSingle();

      if (cacheError) {
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

      // Find the exact picture requested by the browser.
      let picture: NasaPicture;

      try {
        const results = await fetchNasa();

        const matchingPicture = results.find(
          (item) => item.date === date,
        );

        if (
          !matchingPicture ||
          !isValidPicture(matchingPicture)
        ) {
          return fail(
            c,
            502,
            "nasa_error",
            "NASA did not return the requested picture.",
          );
        }

        picture = matchingPicture;
      } catch {
        return fail(
          c,
          502,
          "nasa_error",
          "Could not load the NASA picture.",
        );
      }

      // Generate a Hebrew explanation using Gemini.
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
NASA description: ${cleanHtml(picture.explanation)}

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
          return fail(
            c,
            502,
            "gemini_error",
            "Gemini returned an invalid explanation.",
          );
        }

        explanation = parsed.data;
      } catch {
        return fail(
          c,
          502,
          "gemini_error",
          "Could not process Gemini's response.",
        );
      }

      // Save the explanation by its APOD date.
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