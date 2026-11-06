
import { useEffect, useState } from "react";
import { createGame, makeMove } from "@shared/game/rules";
import type { GameState } from "@shared/game/rules";
import type { Game } from "@shared/schemas/games";
import { api } from "../../lib/api";
import styles from "./TicTacToePage.module.css";

export default function TicTacToePage() {
  const [game, setGame] = useState<GameState>(createGame);
  const [history, setHistory] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let active = true;

    api<Game[]>("/api/games")
      .then((games) => {
        if (active) {
          setHistory(games);
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not load game history.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  
  async function saveGame(moves: number[]) {
    setSaving(true);

    try {
      const saved = await api<Game>("/api/games", {
        method: "POST",
        body: { moves },
      });

      setHistory((previous) => [saved, ...previous]);
    } catch {
      setError("Could not save the game.");
    } finally {
      setSaving(false);
    }
  }

  function handleMove(position: number) {
    if (game.status === "finished" || saving) return;

    try {
      const next = makeMove(game, position);
      setGame(next);
      setError(null);

      if (next.status === "finished") {
        void saveGame(next.moves);
      }
    } catch {
      setError("Invalid move.");
    }
  }

  function newGame() {
    if (saving) return;
    setGame(createGame());
    setError(null);
  }

  const message =
    game.status === "playing"
      ? `Player ${game.currentPlayer}'s turn`
      : game.result === "draw"
        ? "It's a draw!"
        : `Player ${game.result} wins!`;

  return (
    <main className={styles.page}>
      <h1>Misere Tic-Tac-Toe</h1>
      <p>Make three in a row and you lose!</p>

      <p className={styles.status}>{message}</p>

      <div className={styles.board}>
        {game.board.map((cell, index) => (
          <button
            key={index}
            type="button"
            className={styles.cell}
            onClick={() => handleMove(index)}
            disabled={cell !== null || game.status === "finished" || saving}
            aria-label={`Cell ${index + 1}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <button type="button" onClick={newGame} disabled={saving}>
        New game
      </button>

      {saving && <p>Saving game...</p>}
      {error && <p role="alert">{error}</p>}

      <section className={styles.history}>
        <h2>Game history</h2>

        {loading ? (
          <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p>No saved games yet.</p>
        ) : (
          <ul>
            {history.map((saved) => (
              <li key={saved.id}>
                {saved.result === "draw"
                  ? "Draw"
                  : `Player ${saved.result} won`}
                {" - "}
                {new Date(saved.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
