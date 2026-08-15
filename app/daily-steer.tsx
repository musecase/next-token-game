"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { DAILY_PUZZLES, DailyPuzzle, puzzleForDate } from "./daily-puzzles";

type LocalChoice = {
  id: number;
  text: string;
  display: string;
  probability: number;
  relative: number;
  rank: number;
};

type Phase = "menu" | "permission" | "loading" | "playing" | "won" | "error";

type Props = {
  onExit: () => void;
};

const CLOUD_X = [-8, 7, -2, 10, 3, -10, 8, -4, 11, -7, 4, -1];
const CLOUD_Y = [5, -7, 8, 1, -8, 4, 7, -3, -5, 8, -2, 3];

function normalizeToken(text: string) {
  return text.trim().toLocaleLowerCase().replace(/[.,!?;:'"()]/g, "");
}

function scatterChoices(choices: LocalChoice[], step: number) {
  const scattered = [...choices];
  let seed = ((step + 1) * 2654435761) >>> 0;
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  for (let index = scattered.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [scattered[index], scattered[swap]] = [scattered[swap], scattered[index]];
  }
  return scattered;
}

function displayDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export default function DailySteer({ onExit }: Props) {
  const workerRef = useRef<Worker | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [today, setToday] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [status, setStatus] = useState("Waiting to begin");
  const [progress, setProgress] = useState(0);
  const [bytesTotal, setBytesTotal] = useState(570_000_000);
  const [choices, setChoices] = useState<LocalChoice[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [error, setError] = useState("");

  const answer = tokens.join("").trim();
  const cloudChoices = useMemo(() => scatterChoices(choices, step), [choices, step]);
  const unlockedPuzzles = useMemo(
    () => (today ? DAILY_PUZZLES.filter((item) => item.date < today).reverse() : []),
    [today],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentDate = new Date().toISOString().slice(0, 10);
      setToday(currentDate);
      setPuzzle(puzzleForDate(currentDate));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.postMessage({ type: "dispose" });
      workerRef.current?.terminate();
    };
  }, []);

  function selectPuzzle(nextPuzzle: DailyPuzzle) {
    const saved = window.localStorage.getItem(`next-token-steer-best:${nextPuzzle.id}`);
    setPuzzle(nextPuzzle);
    setBest(saved ? Number(saved) : null);
    setPhase("permission");
    setAttempts(0);
    setTokens([]);
    setChoices([]);
    setStep(0);
  }

  function attachWorker() {
    const worker = new Worker(new URL("./local-model.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      const message = event.data;
      if (message.type === "status") setStatus(message.label);
      if (message.type === "progress") {
        setProgress(message.percent ?? 0);
        if (message.total) setBytesTotal(message.total);
      }
      if (message.type === "ready") {
        setChoices(message.choices);
        setBusy(false);
        setStatus("Ready");
        setPhase("playing");
      }
      if (message.type === "choices") {
        setChoices(message.choices);
        setBusy(false);
      }
      if (message.type === "error") {
        setError(message.message);
        setBusy(false);
        setPhase("error");
      }
    };
    return worker;
  }

  function loadPuzzle(isRetry = false) {
    if (!puzzle) return;
    setTokens([]);
    setChoices([]);
    setStep(0);
    setBusy(true);
    setProgress(isRetry ? 100 : 0);
    setStatus(isRetry ? "Resetting the starting distribution…" : "Starting a private model in your browser…");
    setPhase("loading");
    setAttempts((value) => value + 1);

    const worker = workerRef.current ?? attachWorker();
    worker.postMessage({
      type: "load",
      mode: "steer",
      question: puzzle.question,
      target: puzzle.target,
      factPacket: [],
    });
  }

  function begin() {
    if (!("gpu" in navigator)) {
      setError("Daily Steer needs WebGPU. Current Chrome or Edge is the safest first try; newer phones can work too.");
      setPhase("error");
      return;
    }
    loadPuzzle(false);
  }

  function chooseToken(choice: LocalChoice) {
    if (busy || !puzzle) return;
    const nextTokens = [...tokens, choice.text];
    const score = nextTokens.length;
    setTokens(nextTokens);
    setStep((value) => value + 1);

    if (normalizeToken(choice.display) === normalizeToken(puzzle.target)) {
      if (best === null || score < best) {
        setBest(score);
        window.localStorage.setItem(`next-token-steer-best:${puzzle.id}`, String(score));
      }
      setPhase("won");
      return;
    }

    setBusy(true);
    workerRef.current?.postMessage({ type: "choose", tokenId: choice.id });
  }

  if (!puzzle || !today) {
    return (
      <div className="local-loading" aria-live="polite">
        <p className="eyebrow">Daily Steer</p>
        <h1>Finding today.</h1>
      </div>
    );
  }

  if (phase === "menu") {
    const todayPuzzle = puzzleForDate(today);
    return (
      <div className="steer-menu">
        <p className="eyebrow">A daily token puzzle</p>
        <h1>Steer the model.</h1>
        <p className="lede">Reach the target in as few token choices as possible. No timer. Bad path? Start over.</p>

        <article className="steer-daily-card">
          <div>
            <span className="card-label">TODAY · {displayDate(todayPuzzle.date)}</span>
            <h2>{todayPuzzle.question}</h2>
          </div>
          <div className="steer-target-block">
            <span>TARGET TOKEN</span>
            <strong>{todayPuzzle.target}</strong>
          </div>
          <button className="primary-button" onClick={() => selectPuzzle(todayPuzzle)}>PLAY TODAY’S STEER →</button>
        </article>

        <div className="steer-archive-heading">
          <span>PAST PUZZLES</span>
          <span>{unlockedPuzzles.length} AVAILABLE</span>
        </div>
        <div className="steer-archive-grid">
          {unlockedPuzzles.map((item) => (
            <button key={item.id} className="steer-archive-card" onClick={() => selectPuzzle(item)}>
              <span>{displayDate(item.date)} · {item.difficulty}</span>
              <strong>{item.question}</strong>
              <small>target: {item.target}</small>
            </button>
          ))}
        </div>
        <button className="text-button steer-back" onClick={onExit}>BACK TO THE ORIGINAL GAME</button>
      </div>
    );
  }

  if (phase === "permission") {
    return (
      <div className="local-permission steer-permission">
        <p className="eyebrow">Daily Steer · {displayDate(puzzle.date)}</p>
        <h1>Find a path.</h1>
        <p className="lede">The model begins by answering the question. Your choices bend what becomes likely next.</p>
        <div className="steer-brief">
          <div><span>QUESTION</span><strong>{puzzle.question}</strong></div>
          <div><span>TARGET TOKEN</span><strong>{puzzle.target}</strong></div>
        </div>
        <div className="local-warning">
          <strong>FIRST LOAD: ABOUT 570 MB</strong>
          <span>The same local model used by the original game. Your browser should already have it cached if you played that round.</span>
        </div>
        <div className="result-actions">
          <button className="primary-button" onClick={begin}>LOAD THE MODEL</button>
          <button className="text-button" onClick={() => setPhase("menu")}>CHOOSE ANOTHER PUZZLE</button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    const megabytes = Math.round(bytesTotal / 1_000_000);
    return (
      <div className="local-loading" aria-live="polite">
        <p className="eyebrow">Daily Steer · target: {puzzle.target}</p>
        <h1>Waking up the model.</h1>
        <p className="lede">{status}</p>
        <div className="download-meter"><i style={{ width: `${Math.max(2, progress)}%` }} /></div>
        <div className="download-copy"><span>{Math.round(progress)}%</span><span>up to {megabytes} MB</span></div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="local-error">
        <p className="eyebrow">Daily Steer stopped</p>
        <h1>That path closed.</h1>
        <p className="lede">{error}</p>
        <div className="result-actions">
          <button className="primary-button" onClick={() => setPhase("menu")}>BACK TO THE ARCHIVE</button>
          <button className="text-button" onClick={onExit}>BACK TO START</button>
        </div>
      </div>
    );
  }

  if (phase === "won") {
    const score = tokens.length;
    return (
      <div className="result-panel steer-result">
        <p className="eyebrow">Target acquired</p>
        <h1>You got there.</h1>
        <div className="steer-scoreline">
          <div><span>TARGET</span><strong>{puzzle.target}</strong></div>
          <div><span>THIS PATH</span><strong>{score} TOKENS</strong></div>
          <div><span>YOUR BEST</span><strong>{best ?? score} TOKENS</strong></div>
        </div>
        <article className="answer-card player-card steer-path-card">
          <div className="answer-card-heading"><span>YOUR PATH</span><span className="answer-chip">ATTEMPT {attempts}</span></div>
          <p>{answer}</p>
        </article>
        <div className="result-actions">
          <button className="primary-button" onClick={() => loadPuzzle(true)}>TRY A SHORTER PATH</button>
          <button className="text-button" onClick={() => setPhase("menu")}>BACK TO THE ARCHIVE</button>
        </div>
        <p className="tiny-note">Leaderboard comes after we learn which puzzles are actually fair.</p>
      </div>
    );
  }

  return (
    <div className="play-panel local-play steer-play">
      <div className="steer-play-heading">
        <div><span className="card-label">DAILY STEER · {displayDate(puzzle.date)}</span><h2>{puzzle.question}</h2></div>
        <div className="steer-target-live"><span>TARGET</span><strong>{puzzle.target}</strong></div>
      </div>
      <div className="answer-stream" aria-live="polite">
        {answer || <span className="cursor-copy">The path starts here</span>}
        <span className="cursor" aria-hidden="true" />
      </div>
      <div className={`token-zone ${busy ? "token-zone-busy" : ""}`}>
        <div className="zone-heading"><span>{busy ? "CALCULATING THE NEXT CLOUD…" : "STEER TOWARD THE TARGET"}</span><span>{tokens.length} TOKENS</span></div>
        <div className="token-cloud">
          {cloudChoices.map((choice, index) => {
            const isTarget = normalizeToken(choice.display) === normalizeToken(puzzle.target);
            const style = {
              "--token-scale": 0.82 + Math.sqrt(Math.max(0.025, choice.relative)) * 0.32,
              "--token-alpha": 0.48 + choice.relative * 0.52,
              "--cloud-x": `${CLOUD_X[index]}px`,
              "--cloud-y": `${CLOUD_Y[index]}px`,
            } as CSSProperties;
            return (
              <button
                className={`token-choice ${isTarget ? "token-choice-target" : ""}`}
                key={`${step}-${choice.id}`}
                onClick={() => chooseToken(choice)}
                disabled={busy}
                style={style}
                aria-label={`${choice.display}${isTarget ? ", target token" : ""}`}
              >
                <span>{choice.display}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="steer-run-controls">
        <span>ATTEMPT {attempts} · PERSONAL BEST {best ? `${best} TOKENS` : "—"}</span>
        <button className="finish-button" onClick={() => loadPuzzle(true)} disabled={busy}>RESTART PATH</button>
      </div>
    </div>
  );
}
