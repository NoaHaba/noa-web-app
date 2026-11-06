
import { describe, expect, it } from "vitest";
import { createGame, makeMove } from "./rules";

describe("Misere Tic-Tac-Toe", () => {
  it("starts with an empty board and X's turn", () => {
    const game = createGame();

    expect(game.board).toEqual(Array(9).fill(null));
    expect(game.currentPlayer).toBe("X");
    expect(game.status).toBe("playing");
    expect(game.result).toBe(null);
    expect(game.moves).toEqual([]);
  });

  it("alternates players after each move", () => {
    const first = makeMove(createGame(), 0);
    const second = makeMove(first, 4);

    expect(first.board[0]).toBe("X");
    expect(first.currentPlayer).toBe("O");
    expect(second.board[4]).toBe("O");
    expect(second.currentPlayer).toBe("X");
  });

  it("rejects an occupied cell", () => {
    const game = makeMove(createGame(), 0);

    expect(() => makeMove(game, 0)).toThrow(
      "This cell is already occupied",
    );
  });

  it("rejects invalid positions", () => {
    expect(() => makeMove(createGame(), -1)).toThrow();
    expect(() => makeMove(createGame(), 9)).toThrow();
    expect(() => makeMove(createGame(), 1.5)).toThrow();
  });

  it("makes O win when X creates three in a row", () => {
    let game = createGame();

    for (const move of [0, 3, 1, 4, 2]) {
      game = makeMove(game, move);
    }

    expect(game.status).toBe("finished");
    expect(game.result).toBe("O");
  });

  it("makes X win when O creates three in a row", () => {
    let game = createGame();

    for (const move of [3, 0, 4, 1, 8, 2]) {
      game = makeMove(game, move);
    }

    expect(game.status).toBe("finished");
    expect(game.result).toBe("X");
  });

  it("ends in a draw when the board is full without a row", () => {
    let game = createGame();

    for (const move of [0, 1, 2, 4, 3, 6, 7, 5, 8]) {
      game = makeMove(game, move);
    }

    expect(game.status).toBe("finished");
    expect(game.result).toBe("draw");
  });

  it("rejects moves after the game ends", () => {
    let game = createGame();

    for (const move of [0, 3, 1, 4, 2]) {
      game = makeMove(game, move);
    }

    expect(() => makeMove(game, 5)).toThrow(
      "The game is already finished",
    );
  });

  it("does not change the original game state", () => {
    const original = createGame();
    const updated = makeMove(original, 0);

    expect(original.board[0]).toBe(null);
    expect(original.moves).toEqual([]);
    expect(updated.board[0]).toBe("X");
    expect(updated.moves).toEqual([0]);
    expect(updated).not.toBe(original);
    expect(updated.board).not.toBe(original.board);
  });
});
