
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

type ValidPicture = NasaPicture & { hdurl: string };

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
): picture is ValidPicture {
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

async function fetchNasa(
  params: { page?: number; perPage?: number; date?: string } = {},
): Promise<NasaPicture[]> {
  const url = new URL(NASA_URL);

  if (params.date) {
    const [year, month, day] = params.date.split("-");
    url.pathname += `/${year.slice(2)}${month}${day}`;
  } else {
    url.searchParams.set("page", String(params.page ?? 1));
    url.searchParams.set("per_page", String(params.perPage ?? 20));
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA returned ${response.status}`);
  }

  const raw: unknown = await response.json();
  const items = Array.isArray(raw) ? raw : [raw];

  return z.array(pictureSchema).parse(items);
}

async function getTotalPictures(): Promise<number> {
  const url = new URL(NASA_URL);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "1");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA returned ${response.status}`);
  }

  const total = Number(response.headers.get("X-WP-Total"));

  if (!Number.isInteger(total) || total < 1) {
    throw new Error("NASA returned an invalid picture count");
  }

  return total;
}

function getUniquePictures(
  pictures: NasaPicture[],
): ValidPicture[] {
  const unique = new Map<string, ValidPicture>();

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

async function getRandomPictures(
  count: number,
): Promise<ValidPicture[]> {
  const total = await getTotalPictures();
  const perPage = 20;
  const totalPages = Math.ceil(total / perPage);

  const unique = new Map<string, ValidPicture>();
  const visitedPages = new Set<number>();

  // Try a few random pages if some entries are videos
  // or do not have a usable image.
  const maxAttempts = Math.min(totalPages, 5);

  for (
    let attempt = 0;
    attempt < maxAttempts && unique.size < count;
    attempt++
  ) {
    let page: number;

    do {
      page = Math.floor(Math.random() * totalPages) + 1;
    } while (visitedPages.has(page));

    visitedPages.add(page);

    const results = await fetchNasa({
      page,
      perPage,
    });

    for (const picture of getUniquePictures(results)) {
      unique.set(picture.date, picture);
    }
  }

  return shufflePictures([...unique.values()]).slice(
    0,
    count,
  );
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
      const results = await getRandomPictures(count.data);

      if (results.length === 0) {
        return fail(
          c,
          502,
          "nasa_error",
          "NASA did not return any usable pictures.",
        );
      }

      const pictures = results.map((picture) => ({
        date: picture.date,
        title: picture.title,
        explanation: cleanHtml(picture.explanation),
        media_type: picture.media_type,
        url: picture.hdurl,
      }));

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

      // Return a saved explanation before calling NASA or Gemini.
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

      // Fetch the exact APOD picture using YYMMDD.
      let picture: NasaPicture;

      try {
        const results = await fetchNasa({ date });

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
      } catch (error) {
        console.error("NASA picture lookup failed:", error);

        return fail(
          c,
          502,
          "nasa_error",
          "Could not load the NASA picture.",
        );
      }

      // Ask Gemini for a structured Hebrew explanation.
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
          return fail(
            c,
            502,
            "gemini_error",
            "Gemini returned an invalid explanation.",
          );
        }

        explanation = parsed.data;
      } catch (error) {
        console.error("Gemini explanation failed:", error);

        return fail(
          c,
          502,
          "gemini_error",
          "Could not process Gemini's response.",
        );
      }

      // Save one explanation per APOD date.
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

      // Another request may have saved the same date first.
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
