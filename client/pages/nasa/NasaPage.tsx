
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { NasaExplanation } from "@shared/schemas/nasa";
import styles from "./NasaPage.module.css";

type NasaPicture = {
  date: string;
  title: string;
  explanation: string;
  media_type: string;
  url: string;
};

type SavedExplanation = NasaExplanation & {
  date: string;
};

export default function NasaPage() {
  const [pictures, setPictures] = useState<NasaPicture[]>([]);
  const [explanations, setExplanations] = useState<
    Record<string, SavedExplanation>
  >({});
  const [loading, setLoading] = useState(true);
  const [explainingDate, setExplainingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pictureErrors, setPictureErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    api<NasaPicture[]>("/api/nasa/pictures?count=10")
      .then((data) => {
        if (active) setPictures(data);
      })
      .catch(() => {
        if (active) setError("Could not load NASA pictures.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function explainPicture(date: string) {
    setExplainingDate(date);
    setPictureErrors((previous) => ({ ...previous, [date]: "" }));

    try {
      const explanation = await api<SavedExplanation>(
        "/api/nasa/explanations",
        {
          method: "POST",
          body: { date },
        },
      );

      setExplanations((previous) => ({
        ...previous,
        [date]: explanation,
      }));
    } catch {
      setPictureErrors((previous) => ({
        ...previous,
        [date]: "Could not generate an explanation. Please try again.",
      }));
    } finally {
      setExplainingDate(null);
    }
  }

  return (
    <main className={styles.page}>
      <h1>NASA Space Pictures</h1>
      <p>Explore space and get simple explanations in Hebrew.</p>

      {loading && <p>Loading pictures...</p>}
      {error && <p role="alert">{error}</p>}

      <div className={styles.grid}>
        {pictures.map((picture) => {
          const explanation = explanations[picture.date];
          const isExplaining = explainingDate === picture.date;

          return (
            <article key={picture.date} className={styles.card}>
              <img
                src={picture.url}
                alt={picture.title}
                className={styles.image}
                loading="lazy"
              />

              <div className={styles.content}>
                <h2>{picture.title}</h2>
                <p>{picture.date}</p>

                {explanation ? (
                  <div className={styles.explanation} dir="rtl" lang="he">
                    <h3>{explanation.hebrew_title}</h3>
                    <p>{explanation.hebrew_summary}</p>
                    <p>{explanation.tags.join(", ")}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={explainingDate !== null}
                    onClick={() => void explainPicture(picture.date)}
                  >
                    {isExplaining ? "Gemini is thinking..." : "Explain in Hebrew"}
                  </button>
                )}

                {pictureErrors[picture.date] && (
                  <p role="alert">{pictureErrors[picture.date]}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
