
import { createGameSchema } from "@shared/schemas/games";
import { createGame, makeMove } from "@shared/game/rules";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { createAdminClient } from "../lib/supabase";

const COLUMNS = "id, owner_id, moves, result, created_at";

export const games = new Hono<AppEnv>()

  // GET /api/games - the logged-in user's games, newest first.
  .get("/", async (c) => {
    const supabase = createAdminClient(c.env);

    const { data, error } = await supabase
      .from("games")
      .select(COLUMNS)
      .eq("owner_id", c.get("user").id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("list games failed:", error);
      return fail(c, 500, "database_error", "Could not load games.");
    }

    return c.json(data);
  })

  // POST /api/games - validate and save a completed game.
  .post("/", validate("json", createGameSchema), async (c) => {
    const { moves } = c.req.valid("json");

    let game = createGame();

    try {
      // Replay every move using the shared game rules.
      for (const position of moves) {
        game = makeMove(game, position);
      }
    } catch {
      return fail(c, 400, "invalid_input", "Invalid game moves.");
    }

    // Only completed games may be saved.
    if (game.status !== "finished" || game.result === null) {
      return fail(c, 400, "invalid_input", "The game is not finished.");
    }

    const supabase = createAdminClient(c.env);

    const { data, error } = await supabase
      .from("games")
      .insert({
        owner_id: c.get("user").id,
        moves: game.moves,
        result: game.result,
      })
      .select(COLUMNS)
      .single();

    if (error) {
      console.error("create game failed:", error);
      return fail(c, 500, "database_error", "Could not save the game.");
    }

    return c.json(data, 201);
  });
