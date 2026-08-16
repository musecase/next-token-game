"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";

type LocalChoice = {
  id: number;
  text: string;
  display: string;
  probability: number;
  relative: number;
  rank: number;
};

type Phase = "permission" | "loading" | "playing" | "result" | "error";

type Props = {
  question: string;
  reference: string;
  factPacket: string[];
  preparedInCloud: boolean;
  onExit: () => void;
};

const CLOUD_X = [-8, 7, -2, 10, 3, -10, 8, -4, 11, -7, 4, -1];
const CLOUD_Y = [5, -7, 8, 1, -8, 4, 7, -3, -5, 8, -2, 3];

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

function formatTime(milliseconds: number) {
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  return `${(milliseconds / 1000).toFixed(1)} sec`;
}

export default function LocalModelLab({ question, reference, factPacket, preparedInCloud, onExit }: Props) {
  const workerRef = useRef<Worker | null>(null);
  const [phase, setPhase] = useState<Phase>("permission");
  const [status, setStatus] = useState("Waiting to begin");
  const [progress, setProgress] = useState(0);
  const [bytesTotal, setBytesTotal] = useState(570_000_000);
  const [choices, setChoices] = useState<LocalChoice[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(38);
  const [busy, setBusy] = useState(false);
  const [greedyPicks, setGreedyPicks] = useState(0);
  const [modelLoadMs, setModelLoadMs] = useState(0);
  const [prefillMs, setPrefillMs] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState(0);
  const [error, setError] = useState("");

  const answer = tokens.join("").trim();
  const cloudChoices = useMemo(() => scatterChoices(choices, step), [choices, step]);
  const deviceMemory = typeof navigator !== "undefined" && "deviceMemory" in navigator
    ? `${(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "?"} GB class`
    : "not reported";

  useEffect(() => {
    return () => {
      workerRef.current?.postMessage({ type: "dispose" });
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setTimeout(() => {
      if (seconds <= 1) {
        setSeconds(0);
        setPhase("result");
      } else {
        setSeconds((value) => value - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, seconds]);

  function begin() {
    if (!("gpu" in navigator)) {
      setError("This experiment needs WebGPU. Current Chrome or Edge is the safest first try; newer phones can work too.");
      setPhase("error");
      return;
    }

    setPhase("loading");
    setStatus("Starting a private model in your browser…");
    setProgress(0);
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
        if (message.modelLoadMs > 0) setModelLoadMs(message.modelLoadMs);
        setPrefillMs(message.prefillMs);
        setBusy(false);
        setStatus("Ready");
        setPhase("playing");
      }
      if (message.type === "choices") {
        setChoices(message.choices);
        setLastLatencyMs(message.latencyMs);
        setBusy(false);
      }
      if (message.type === "error") {
        setError(message.message);
        setPhase("error");
        setBusy(false);
      }
    };
    worker.postMessage({ type: "load", question, factPacket });
  }

  function chooseToken(choice: LocalChoice) {
    if (busy) return;
    setTokens((current) => [...current, choice.text]);
    if (choice.rank === 0) setGreedyPicks((value) => value + 1);
    setStep((value) => value + 1);
    setBusy(true);
    workerRef.current?.postMessage({ type: "choose", tokenId: choice.id });
  }

  function replayRound() {
    setTokens([]);
    setStep(0);
    setSeconds(38);
    setGreedyPicks(0);
    setLastLatencyMs(0);
    setChoices([]);
    setBusy(true);
    setStatus("Resetting the same factual starting point…");
    setProgress(100);
    setPhase("loading");
    workerRef.current?.postMessage({ type: "load", question, factPacket });
  }

  if (phase === "permission") {
    return (
      <div className="local-permission">
        <p className="eyebrow">Local-model lab</p>
        <h1>The real distribution.</h1>
        <p className="lede">
          {preparedInCloud
            ? "One cloud call prepared the factual path. From here on, every token choice runs on your device."
            : "This ready-made round runs a small language model on your own device. No question leaves your browser."}
        </p>
        <div className="local-warning">
          <strong>FIRST LOAD: ABOUT 570 MB</strong>
          <span>It should be cached by your browser for later runs.</span>
          <span>Chrome or Edge recommended · newer phones can work · experimental</span>
        </div>
        <div className="result-actions">
          <button className="primary-button" onClick={begin}>DOWNLOAD &amp; TRY IT</button>
          <button className="text-button" onClick={onExit}>NOT RIGHT NOW</button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    const megabytes = Math.round(bytesTotal / 1_000_000);
    return (
      <div className="local-loading" aria-live="polite">
        <p className="eyebrow">Local-model lab</p>
        <h1>Waking up a tiny model.</h1>
        <p className="lede">{status}</p>
        <div className="download-meter">
          <i style={{ width: `${Math.max(2, progress)}%` }} />
        </div>
        <div className="download-copy"><span>{Math.round(progress)}%</span><span>up to {megabytes} MB</span></div>
        <p className="tiny-note">Keep this tab open. The first run includes download, unpacking, and GPU warm-up.</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="local-error">
        <p className="eyebrow">The experiment stopped</p>
        <h1>That device said no.</h1>
        <p className="lede">{error}</p>
        <button className="primary-button" onClick={onExit}>BACK TO THE PLAYABLE VERSION</button>
      </div>
    );
  }

  if (phase === "result") {
    const greedyPull = tokens.length ? (greedyPicks / tokens.length) * 100 : 0;
    return (
      <div className="result-panel local-result">
        <p className="eyebrow">A real 0.6B model made those choices</p>
        <h1>How did it feel?</h1>
        <div className="comparison-grid">
          <article className="answer-card player-card">
            <div className="answer-card-heading"><span>YOUR RUN</span><span className="answer-chip">{tokens.length} TOKENS</span></div>
            <p>{answer || "No answer escaped the model."}</p>
          </article>
          <article className="answer-card reference-card">
            <div className="answer-card-heading"><span>REFERENCE ANSWER</span><span className="answer-chip answer-chip-green">FACT PACKET</span></div>
            <p>{reference}</p>
          </article>
        </div>
        <div className="lab-readout">
          <div><span>MODEL START</span><strong>{formatTime(modelLoadMs)}</strong></div>
          <div><span>FIRST CLOUD</span><strong>{formatTime(prefillMs)}</strong></div>
          <div><span>LAST TAP</span><strong>{lastLatencyMs ? formatTime(lastLatencyMs) : "—"}</strong></div>
          <div><span>DEVICE MEMORY</span><strong>{deviceMemory}</strong></div>
        </div>
        <div className="result-meter local-habit-meter">
          <div className="result-meter-heading"><span>BIGGEST-TOKEN HABIT</span><strong>{greedyPull > 72 ? "followed the crowd" : greedyPull > 36 ? "mixed it up" : "went exploring"}</strong></div>
          <div className="result-meter-track"><i style={{ width: `${greedyPull}%` }} /></div>
          <div className="meter-ends"><span>exploring</span><span>always chose biggest</span></div>
        </div>
        <div className="result-actions">
          <button className="primary-button" onClick={replayRound}>REPLAY THIS ROUND</button>
          <button className="text-button" onClick={onExit}>TRY A NEW QUESTION</button>
        </div>
        <p className="tiny-note">Same Luna answer · fresh local path · no new cloud call</p>
      </div>
    );
  }

  return (
    <div className="play-panel local-play">
      <div className="play-heading">
        <div><span className="card-label">QUESTION · LIVE LOCAL MODEL</span><h2>{question}</h2></div>
        <div className="play-controls">
          <button className="finish-button" onClick={() => setPhase("result")} disabled={tokens.length === 0}>FINISH</button>
          <div className={`timer ${seconds < 10 ? "timer-hot" : ""}`}><span>{seconds}</span><small>SEC</small></div>
        </div>
      </div>
      <div className="answer-stream" aria-live="polite">
        {answer || <span className="cursor-copy">Your answer starts here</span>}
        <span className="cursor" aria-hidden="true" />
      </div>
      <div className={`token-zone ${busy ? "token-zone-busy" : ""}`}>
        <div className="zone-heading"><span>{busy ? "CALCULATING THE NEXT CLOUD…" : "CHOOSE THE NEXT TOKEN"}</span><span>REAL LOGITS · {tokens.length} CHOSEN</span></div>
        <div className="token-cloud">
          {cloudChoices.map((choice, index) => {
            const style = {
              "--token-scale": 1 + Math.pow(Math.max(0.02, choice.relative), 0.58) * 0.48,
              "--token-alpha": 0.58 + Math.pow(Math.max(0.02, choice.relative), 0.65) * 0.42,
              "--cloud-x": `${CLOUD_X[index]}px`,
              "--cloud-y": `${CLOUD_Y[index]}px`,
            } as CSSProperties;
            return (
              <button
                className="token-choice"
                key={`${step}-${choice.id}`}
                onClick={() => chooseToken(choice)}
                disabled={busy}
                style={style}
                aria-label={`${choice.display}, ${(choice.probability * 100).toFixed(1)} percent likely`}
              >
                <span>{choice.display}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="lab-live-readout">
        <span>QWEN3 0.6B · RUNNING ON YOUR GPU</span>
        <span>{lastLatencyMs ? `LAST CLOUD ${formatTime(lastLatencyMs)}` : `FIRST CLOUD ${formatTime(prefillMs)}`}</span>
      </div>
    </div>
  );
}
