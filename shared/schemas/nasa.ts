
import { z } from "zod";

export const nasaTags = [
  "galaxy",
  "planet",
  "nebula",
  "earth",
  "sun",
] as const;

export const explanationSchema = z.object({
  hebrew_title: z.string().min(1),
  hebrew_summary: z.string().min(1),
  tags: z.array(z.enum(nasaTags)).min(1).max(5),
});

export const explanationRequestSchema = z.object({
  date: z.iso.date(),
});

export type NasaExplanation = z.infer<typeof explanationSchema>;
