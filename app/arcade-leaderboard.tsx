"use client";

import { FormEvent, useEffect, useState } from "react";

type Entry = {
  name: string;
  score: number;
};

type Props = {
  date: string;
  puzzleId: string;
  score: number;
};

type BoardState = "loading" | "ready" | "disabled" | "error";

function getPlayerId() {
  const key = "next-token-arcade-player:v1";
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export default function ArcadeLeaderboard({ date, puzzleId, score }: Props) {
  const [state, setState] = useState<BoardState>("loading");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBoard() {
      try {
        const params = new URLSearchParams({ date, puzzle: puzzleId });
        const response = await fetch(`/api/leaderboard?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Scoreboard request failed");
        const data = await response.json();
        const savedName = window.localStorage.getItem("next-token-arcade-name:v1");
        if (savedName) setName(savedName);
        if (!data.enabled) {
          setState("disabled");
          return;
        }
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setState("ready");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setState("error");
      }
    }

    loadBoard();
    return () => controller.abort();
  }, [date, puzzleId]);

  const qualifies = entries.length < 10 || score < (entries.at(-1)?.score ?? Number.POSITIVE_INFINITY);

  async function submitScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, puzzleId, score, name, playerId: getPlayerId() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "That score would not stick.");
        return;
      }

      const cleanName = name.trim().replace(/\s+/g, " ").toUpperCase();
      window.localStorage.setItem("next-token-arcade-name:v1", cleanName);
      setName(cleanName);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setSubmitted(true);
      setMessage("Score posted.");
    } catch {
      setMessage("The scoreboard did not answer. Your local best is still safe.");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "loading") {
    return <section className="arcade-board" aria-live="polite"><p>CHECKING THE ARCADE BOARD…</p></section>;
  }

  if (state === "disabled") {
    return (
      <section className="arcade-board arcade-board-offline">
        <div><span>ARCADE TOP 10</span><strong>COMING ONLINE</strong></div>
        <p>The game is ready. Its tiny scoreboard database still needs to be connected.</p>
      </section>
    );
  }

  if (state === "error") {
    return <section className="arcade-board arcade-board-offline"><p>THE ARCADE BOARD IS TEMPORARILY DARK.</p></section>;
  }

  return (
    <section className="arcade-board">
      <div className="arcade-board-heading">
        <div><span>ARCADE TOP 10</span><strong>FEWEST TOKENS WINS</strong></div>
        <span>{entries.length}/10 SCORES</span>
      </div>

      {entries.length > 0 ? (
        <ol className="arcade-score-list">
          {entries.map((entry, index) => (
            <li key={`${entry.name}-${index}`}><span>{index + 1}</span><strong>{entry.name}</strong><em>{entry.score}</em></li>
          ))}
        </ol>
      ) : <p className="arcade-empty">The cabinet is waiting for its first initials.</p>}

      {qualifies && !submitted ? (
        <form className="arcade-name-form" onSubmit={submitScore}>
          <label htmlFor="arcade-name">YOUR SCORE MADE THE BOARD</label>
          <div>
            <input
              id="arcade-name"
              value={name}
              onChange={(event) => setName(event.target.value.toUpperCase())}
              maxLength={10}
              pattern="[A-Za-z0-9 ]{1,10}"
              placeholder="YOUR NAME"
              autoComplete="nickname"
              required
            />
            <button type="submit" disabled={submitting}>{submitting ? "POSTING…" : "POST SCORE"}</button>
          </div>
          <small>1–10 letters or numbers. No account.</small>
        </form>
      ) : null}
      {message ? <p className="arcade-message" aria-live="polite">{message}</p> : null}
    </section>
  );
}
