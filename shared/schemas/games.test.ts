
import { describe, expect, it } from "vitest";
import { createGameSchema } from "./games";

describe("createGameSchema", () => {
  it("accepts a valid list of moves", () => {
    const result = createGameSchema.safeParse({
      moves: [0, 3, 1, 4, 2],
    });

    expect(result.success).toBe(true);
  });

  it("rejects fewer than 5 moves", () => {
    const result = createGameSchema.safeParse({
      moves: [0, 1, 2],
    });

    expect(result.success).toBe(false);
  });

  it("rejects more than 9 moves", () => {
    const result = createGameSchema.safeParse({
      moves: [0, 1, 2, 3, 4, 5, 6, 7, 8, 0],
    });

    expect(result.success).toBe(false);
  });

  it("rejects positions outside the board", () => {
    const result = createGameSchema.safeParse({
      moves: [0, 1, 2, 3, 9],
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer positions", () => {
    const result = createGameSchema.safeParse({
      moves: [0, 1, 2, 3, 4.5],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a result sent by the client", () => {
    const result = createGameSchema.safeParse({
      moves: [0, 3, 1, 4, 2],
      result: "X",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("result");
    }
  });
});
