
import { z } from "zod";

/** A completed game, as the API returns it. */
export const gameSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  moves: z.array(z.number().int().min(0).max(8)),
  result: z.enum(["X", "O", "draw"]),
  created_at: z.string(),
});

/** The client sends only the moves. The server calculates the result. */
export const createGameSchema = z.object({
  moves: z.array(z.number().int().min(0).max(8)).min(5).max(9),
});

// Types are inferred from the schemas, as in the events example.
export type Game = z.infer<typeof gameSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
