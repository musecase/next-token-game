"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import LocalModelLab from "./local-model-lab";

type Lane = "fact" | "plausible" | "drift";

type TokenChoice = {
  text: string;
  weight: number;
  lane: Lane;
};

type RoundStep = TokenChoice[];

function tail(texts: string[]): RoundStep {
  return texts.map((text, index) => ({
    text,
    weight: Math.max(0.9, 4.2 - index * 0.62),
    lane: index < 2 ? "plausible" : "drift",
  }));
}

const EXTRA_BANKS: Record<string, RoundStep> = {
  starters: tail(["During", "Although", "Since", "Typically", "Seasonal", "Cooler"]),
  timeNouns: tail([" daylight", " seasons", " shorter days", " fall", " cold", " climate"]),
  changeVerbs: tail([" decrease", " shift", " begin", " pass", " decline", " vanish"]),
  connectors: tail([" as", " because", " but", " then", " so", " therefore"]),
  conditions: tail([" daylight", " conditions", " hours", " air", " seasons", " moisture"]),
  cooling: tail([" fall", " dip", " fluctuate", " shorten", " arrive", " weaken"]),
  subjects: tail([", deciduous trees", ", the plant", ", tree cells", ", branches", ", maples", ", forests"]),
  actions: tail([" gradually", " tend to", " start to", " no longer", " eventually", " try to"]),
  making: tail([" creating", " using", " replacing", " moving", " losing", " changing"]),
  substances: tail([" sugar", " carbon", " moisture", " sap", " sunlight", " minerals"]),
  joins: tail([", while", ". As", ", but", ", because", ", causing", ", until"]),
  determiners: tail([" existing", " visible", " yellow", " orange", " leaf's", " remaining"]),
  colors: tail([" orange", " brown", " bright", " natural", " underlying", " seasonal"]),
  pigmentNouns: tail([" pigments", " molecules", " compounds", " surface", " tissue", " chemistry"]),
  processes: tail([" degrades", " disappears", " recedes", " dissolves", " changes", " weakens"]),
  processEnds: tail([" gradually", " over time", " first", " in the leaf", " each fall", " from view"]),
  reveals: tail([", uncovering", ", showing", ", making", ", so", ", until", ", producing"]),
  warmColors: tail([" golden", " brown", " vivid", " warm", " carotenoid", " autumn"]),
  addition: tail([" or", " alongside", " plus", " with", " beside", " sometimes"]),
  orangeColors: tail([" golden", " amber", " brown", " crimson", " warmer", " brighter"]),
  colorThings: tail([" carotenoids", " molecules", " compounds", " tones", " chemicals", " layers"]),
  presence: tail([" naturally", " normally", " quietly", " previously", " continually", " invisibly"]),
  states: tail([" stored", " contained", " embedded", " masked", " produced", " trapped"]),
  locations: tail([" within", " throughout", " under", " across", " around", " beneath"]),
  articles: tail([" each", " a", " every", " that", " this", " one"]),
  leafParts: tail([" tissue", " cells", " plant", " canopy", " tree", " surface"]),
  visibilityVerbs: tail([" appear", " look", " grow", " seem", " remain", " turn"]),
  visibility: tail([" noticeable", " brighter", " exposed", " dominant", " colorful", " clear"]),
  contrast: tail(["; meanwhile,", ". Meanwhile,", ", although", ", but", ", and", "; also,"]),
  quantities: tail([" many", " certain", " other", " a few", " particular", " red-leafed"]),
  treeKinds: tail([" species", " leaves", " plants", " maples", " varieties", " forests"]),
  frequency: tail([" can", " may", " sometimes", " then", " often", " even"]),
  creation: tail([" make", " create", " develop", " reveal", " build", " absorb"]),
  reds: tail([" crimson", " purple", " darker", " new", " bright", " extra"]),
  redThings: tail([" anthocyanins", " colors", " compounds", " tones", " chemicals", " molecules"]),
  endings: tail([" in autumn.", " as well.", " too.", " before falling.", " over time.", " each year."]),
};

const EXTRA_PATTERN = [
  "starters", "timeNouns", "changeVerbs", "connectors", "conditions", "cooling",
  "subjects", "actions", "making", "substances", "joins", "determiners", "colors",
  "pigmentNouns", "processes", "processEnds", "reveals", "warmColors", "addition",
  "orangeColors", "colorThings", "presence", "states", "locations", "articles",
  "leafParts", "visibilityVerbs", "visibility", "contrast", "quantities", "treeKinds",
  "frequency", "creation", "reds", "redThings", "endings",
];

const ROUND: RoundStep[] = [
  [
    { text: "As", weight: 36, lane: "fact" },
    { text: "Because", weight: 24, lane: "plausible" },
    { text: "When", weight: 17, lane: "fact" },
    { text: "Leaves", weight: 10, lane: "plausible" },
    { text: "In", weight: 8, lane: "plausible" },
    { text: "The", weight: 5, lane: "drift" },
  ],
  [
    { text: " days", weight: 34, lane: "fact" },
    { text: " autumn", weight: 25, lane: "plausible" },
    { text: " temperatures", weight: 18, lane: "fact" },
    { text: " the", weight: 12, lane: "plausible" },
    { text: " sunlight", weight: 7, lane: "drift" },
    { text: " weather", weight: 4, lane: "drift" },
  ],
  [
    { text: " shorten", weight: 38, lane: "fact" },
    { text: " cool", weight: 21, lane: "fact" },
    { text: " arrives", weight: 18, lane: "plausible" },
    { text: " change", weight: 11, lane: "plausible" },
    { text: " fades", weight: 8, lane: "drift" },
    { text: " weakens", weight: 4, lane: "drift" },
  ],
  [
    { text: " and", weight: 33, lane: "fact" },
    { text: ",", weight: 25, lane: "plausible" },
    { text: " while", weight: 17, lane: "plausible" },
    { text: " trees", weight: 12, lane: "fact" },
    { text: " the", weight: 8, lane: "plausible" },
    { text: " sunlight", weight: 5, lane: "drift" },
  ],
  [
    { text: " temperatures", weight: 31, lane: "fact" },
    { text: " nights", weight: 24, lane: "plausible" },
    { text: " leaves", weight: 19, lane: "plausible" },
    { text: " pigments", weight: 13, lane: "fact" },
    { text: " weather", weight: 8, lane: "drift" },
    { text: " sunlight", weight: 5, lane: "drift" },
  ],
  [
    { text: " cool", weight: 37, lane: "fact" },
    { text: " drop", weight: 23, lane: "plausible" },
    { text: " change", weight: 18, lane: "plausible" },
    { text: " darken", weight: 11, lane: "plausible" },
    { text: " freeze", weight: 7, lane: "drift" },
    { text: " disappear", weight: 4, lane: "drift" },
  ],
  [
    { text: ", trees", weight: 35, lane: "fact" },
    { text: ", leaves", weight: 26, lane: "plausible" },
    { text: ", plants", weight: 17, lane: "plausible" },
    { text: ", forests", weight: 11, lane: "plausible" },
    { text: ", cells", weight: 7, lane: "drift" },
    { text: ", nature", weight: 4, lane: "drift" },
  ],
  [
    { text: " stop", weight: 39, lane: "fact" },
    { text: " begin", weight: 23, lane: "plausible" },
    { text: " slowly", weight: 16, lane: "plausible" },
    { text: " can", weight: 11, lane: "plausible" },
    { text: " must", weight: 7, lane: "drift" },
    { text: " suddenly", weight: 4, lane: "drift" },
  ],
  [
    { text: " producing", weight: 42, lane: "fact" },
    { text: " making", weight: 24, lane: "fact" },
    { text: " absorbing", weight: 15, lane: "drift" },
    { text: " storing", weight: 9, lane: "plausible" },
    { text: " releasing", weight: 6, lane: "drift" },
    { text: " needing", weight: 4, lane: "drift" },
  ],
  [
    { text: " chlorophyll", weight: 45, lane: "fact" },
    { text: " food", weight: 20, lane: "plausible" },
    { text: " green", weight: 14, lane: "plausible" },
    { text: " energy", weight: 10, lane: "plausible" },
    { text: " heat", weight: 7, lane: "drift" },
    { text: " oxygen", weight: 4, lane: "drift" },
  ],
  [
    { text: ", and", weight: 34, lane: "fact" },
    { text: ".", weight: 24, lane: "plausible" },
    { text: ", so", weight: 19, lane: "plausible" },
    { text: ";", weight: 10, lane: "plausible" },
    { text: ", which", weight: 8, lane: "fact" },
    { text: " because", weight: 5, lane: "drift" },
  ],
  [
    { text: " the", weight: 36, lane: "fact" },
    { text: " other", weight: 23, lane: "fact" },
    { text: " their", weight: 17, lane: "plausible" },
    { text: " hidden", weight: 11, lane: "fact" },
    { text: " bright", weight: 8, lane: "plausible" },
    { text: " cold", weight: 5, lane: "drift" },
  ],
  [
    { text: " green", weight: 30, lane: "fact" },
    { text: " yellow", weight: 26, lane: "fact" },
    { text: " remaining", weight: 18, lane: "plausible" },
    { text: " leaf", weight: 12, lane: "plausible" },
    { text: " autumn", weight: 9, lane: "plausible" },
    { text: " red", weight: 5, lane: "drift" },
  ],
  [
    { text: " pigment", weight: 38, lane: "fact" },
    { text: " chlorophyll", weight: 26, lane: "fact" },
    { text: " color", weight: 16, lane: "plausible" },
    { text: " layer", weight: 10, lane: "plausible" },
    { text: " light", weight: 6, lane: "drift" },
    { text: " cells", weight: 4, lane: "drift" },
  ],
  [
    { text: " breaks", weight: 39, lane: "fact" },
    { text: " fades", weight: 24, lane: "plausible" },
    { text: " becomes", weight: 16, lane: "plausible" },
    { text: " is", weight: 10, lane: "plausible" },
    { text: " turns", weight: 7, lane: "drift" },
    { text: " freezes", weight: 4, lane: "drift" },
  ],
  [
    { text: " down", weight: 41, lane: "fact" },
    { text: " away", weight: 22, lane: "plausible" },
    { text: " apart", weight: 16, lane: "plausible" },
    { text: " first", weight: 10, lane: "plausible" },
    { text: " red", weight: 7, lane: "drift" },
    { text: " overnight", weight: 4, lane: "drift" },
  ],
  [
    { text: ", revealing", weight: 37, lane: "fact" },
    { text: ".", weight: 25, lane: "fact" },
    { text: ", leaving", weight: 17, lane: "plausible" },
    { text: ", exposing", weight: 11, lane: "fact" },
    { text: " in autumn.", weight: 6, lane: "plausible" },
    { text: " from cold.", weight: 4, lane: "drift" },
  ],
  [
    { text: " yellow", weight: 38, lane: "fact" },
    { text: " orange", weight: 26, lane: "fact" },
    { text: " other", weight: 16, lane: "plausible" },
    { text: " bright", weight: 10, lane: "plausible" },
    { text: " hidden", weight: 6, lane: "plausible" },
    { text: " cold", weight: 4, lane: "drift" },
  ],
  [
    { text: " and", weight: 39, lane: "fact" },
    { text: " or", weight: 23, lane: "plausible" },
    { text: ",", weight: 16, lane: "plausible" },
    { text: " with", weight: 10, lane: "plausible" },
    { text: " as", weight: 7, lane: "drift" },
    { text: " plus", weight: 5, lane: "drift" },
  ],
  [
    { text: " orange", weight: 41, lane: "fact" },
    { text: " red", weight: 22, lane: "plausible" },
    { text: " golden", weight: 16, lane: "fact" },
    { text: " brown", weight: 10, lane: "plausible" },
    { text: " warmer", weight: 7, lane: "drift" },
    { text: " darker", weight: 4, lane: "drift" },
  ],
  [
    { text: " pigments", weight: 43, lane: "fact" },
    { text: " colors", weight: 23, lane: "plausible" },
    { text: " compounds", weight: 14, lane: "fact" },
    { text: " tones", weight: 9, lane: "plausible" },
    { text: " chemicals", weight: 7, lane: "plausible" },
    { text: " cells", weight: 4, lane: "drift" },
  ],
  [
    { text: " already", weight: 39, lane: "fact" },
    { text: " naturally", weight: 24, lane: "fact" },
    { text: " long", weight: 15, lane: "plausible" },
    { text: " still", weight: 10, lane: "plausible" },
    { text: " normally", weight: 7, lane: "plausible" },
    { text: " newly", weight: 5, lane: "drift" },
  ],
  [
    { text: " present", weight: 40, lane: "fact" },
    { text: " stored", weight: 22, lane: "plausible" },
    { text: " found", weight: 16, lane: "plausible" },
    { text: " hidden", weight: 11, lane: "fact" },
    { text: " produced", weight: 7, lane: "drift" },
    { text: " trapped", weight: 4, lane: "drift" },
  ],
  [
    { text: " in", weight: 42, lane: "fact" },
    { text: " inside", weight: 22, lane: "plausible" },
    { text: " throughout", weight: 14, lane: "plausible" },
    { text: " under", weight: 10, lane: "plausible" },
    { text: " within", weight: 7, lane: "fact" },
    { text: " across", weight: 5, lane: "drift" },
  ],
  [
    { text: " the", weight: 46, lane: "fact" },
    { text: " each", weight: 19, lane: "plausible" },
    { text: " a", weight: 14, lane: "plausible" },
    { text: " every", weight: 9, lane: "plausible" },
    { text: " that", weight: 7, lane: "drift" },
    { text: " this", weight: 5, lane: "drift" },
  ],
  [
    { text: " leaf", weight: 44, lane: "fact" },
    { text: " leaves", weight: 22, lane: "plausible" },
    { text: " tissue", weight: 14, lane: "fact" },
    { text: " cells", weight: 9, lane: "plausible" },
    { text: " plant", weight: 7, lane: "drift" },
    { text: " tree", weight: 4, lane: "drift" },
  ],
  [
    { text: " become", weight: 38, lane: "fact" },
    { text: " are", weight: 26, lane: "plausible" },
    { text: " grow", weight: 14, lane: "plausible" },
    { text: " remain", weight: 10, lane: "plausible" },
    { text: " look", weight: 7, lane: "drift" },
    { text: " turn", weight: 5, lane: "drift" },
  ],
  [
    { text: " visible", weight: 42, lane: "fact" },
    { text: " brighter", weight: 22, lane: "plausible" },
    { text: " noticeable", weight: 14, lane: "fact" },
    { text: " exposed", weight: 10, lane: "plausible" },
    { text: " colorful", weight: 7, lane: "drift" },
    { text: " dominant", weight: 5, lane: "drift" },
  ],
  [
    { text: ", while", weight: 38, lane: "fact" },
    { text: "; meanwhile,", weight: 22, lane: "plausible" },
    { text: ". Some", weight: 16, lane: "fact" },
    { text: ", and", weight: 10, lane: "plausible" },
    { text: ", although", weight: 8, lane: "drift" },
    { text: ", but", weight: 6, lane: "drift" },
  ],
  [
    { text: " some", weight: 41, lane: "fact" },
    { text: " many", weight: 22, lane: "plausible" },
    { text: " certain", weight: 15, lane: "fact" },
    { text: " other", weight: 10, lane: "plausible" },
    { text: " a few", weight: 7, lane: "plausible" },
    { text: " red", weight: 5, lane: "drift" },
  ],
  [
    { text: " trees", weight: 40, lane: "fact" },
    { text: " species", weight: 24, lane: "fact" },
    { text: " leaves", weight: 14, lane: "plausible" },
    { text: " plants", weight: 10, lane: "plausible" },
    { text: " maples", weight: 7, lane: "fact" },
    { text: " pigments", weight: 5, lane: "drift" },
  ],
  [
    { text: " also", weight: 37, lane: "fact" },
    { text: " can", weight: 25, lane: "plausible" },
    { text: " may", weight: 15, lane: "plausible" },
    { text: " sometimes", weight: 11, lane: "fact" },
    { text: " then", weight: 7, lane: "drift" },
    { text: " often", weight: 5, lane: "plausible" },
  ],
  [
    { text: " produce", weight: 42, lane: "fact" },
    { text: " make", weight: 23, lane: "fact" },
    { text: " create", weight: 14, lane: "plausible" },
    { text: " develop", weight: 10, lane: "plausible" },
    { text: " reveal", weight: 7, lane: "drift" },
    { text: " absorb", weight: 4, lane: "drift" },
  ],
  [
    { text: " red", weight: 43, lane: "fact" },
    { text: " crimson", weight: 22, lane: "plausible" },
    { text: " purple", weight: 14, lane: "plausible" },
    { text: " darker", weight: 10, lane: "plausible" },
    { text: " new", weight: 7, lane: "drift" },
    { text: " bright", weight: 4, lane: "drift" },
  ],
  [
    { text: " pigments", weight: 40, lane: "fact" },
    { text: " anthocyanins", weight: 25, lane: "fact" },
    { text: " colors", weight: 15, lane: "plausible" },
    { text: " compounds", weight: 9, lane: "plausible" },
    { text: " tones", weight: 7, lane: "drift" },
    { text: " chemicals", weight: 4, lane: "drift" },
  ],
  [
    { text: ".", weight: 46, lane: "fact" },
    { text: " in autumn.", weight: 19, lane: "plausible" },
    { text: " as well.", weight: 14, lane: "plausible" },
    { text: " too.", weight: 9, lane: "plausible" },
    { text: " before falling.", weight: 7, lane: "fact" },
    { text: " over time.", weight: 5, lane: "drift" },
  ],
];

const QUESTION = "Why do leaves change color in autumn?";
const REFERENCE =
  "As days shorten and temperatures cool, trees stop producing chlorophyll. As the green chlorophyll breaks down, yellow and orange pigments already in the leaf become visible; some trees also produce red pigments.";
const FACT_PACKET = [
  "Shorter autumn days and cooler temperatures signal deciduous trees to stop producing chlorophyll.",
  "When green chlorophyll breaks down, yellow and orange carotenoid pigments already in the leaf become visible.",
  "Some tree species produce red anthocyanin pigments during autumn.",
];

type PreparedRound = {
  question: string;
  reference: string;
  factPacket: string[];
};

type Mode = "intro" | "preparing" | "prepareError" | "playing" | "result" | "local";

function getChoices(step: number, drift: number) {
  const base = ROUND[step] ?? [];
  const extras = EXTRA_BANKS[EXTRA_PATTERN[step]] ?? [];
  const seen = new Set<string>();
  const choices = [...base, ...extras].filter((choice) => {
    const key = choice.text.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
  const adjusted = choices.map((choice) => {
    const driftBoost = choice.lane === "drift" ? 1 + drift * 0.22 : 1;
    const factDrag = choice.lane === "fact" ? Math.max(0.62, 1 - drift * 0.06) : 1;
    return { ...choice, adjusted: choice.weight * driftBoost * factDrag };
  });
  const total = adjusted.reduce((sum, choice) => sum + choice.adjusted, 0);
  return adjusted
    .map((choice) => ({ ...choice, probability: choice.adjusted / total }))
    .sort((a, b) => b.probability - a.probability)
    .map((choice, rank) => ({ ...choice, rank }));
}

function scatterChoices(choices: ReturnType<typeof getChoices>, step: number) {
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

const CLOUD_X = [-8, 7, -2, 10, 3, -10, 8, -4, 11, -7, 4, -1];
const CLOUD_Y = [5, -7, 8, 1, -8, 4, 7, -3, -5, 8, -2, 3];

export default function TokenGame() {
  const [mode, setMode] = useState<Mode>("intro");
  const [questionDraft, setQuestionDraft] = useState("");
  const [preparedRound, setPreparedRound] = useState<PreparedRound>({
    question: QUESTION,
    reference: REFERENCE,
    factPacket: FACT_PACKET,
  });
  const [preparedInCloud, setPreparedInCloud] = useState(false);
  const [prepareError, setPrepareError] = useState("");
  const [customQuestions, setCustomQuestions] = useState<"checking" | "ready" | "off">("checking");
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(38);
  const [tokens, setTokens] = useState<string[]>([]);
  const [drift, setDrift] = useState(0);
  const [greedyPicks, setGreedyPicks] = useState(0);

  const choices = useMemo(() => getChoices(step, drift), [step, drift]);
  const cloudChoices = useMemo(() => scatterChoices(choices, step), [choices, step]);
  const answer = tokens.join("").trim();
  const greedyPull = tokens.length ? (greedyPicks / tokens.length) * 100 : 0;
  const driftLevel = Math.min(100, (drift / 6) * 100);

  useEffect(() => {
    let active = true;
    fetch("/api/fact-packet")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (active) setCustomQuestions(data.configured ? "ready" : "off");
      })
      .catch(() => {
        if (active) setCustomQuestions("off");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (mode !== "playing") return;
    const timer = window.setTimeout(() => {
      if (seconds <= 1) {
        setSeconds(0);
        setMode("result");
      } else {
        setSeconds((value) => value - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [mode, seconds]);

  function startRound() {
    setMode("playing");
    setStep(0);
    setSeconds(38);
    setTokens([]);
    setDrift(0);
    setGreedyPicks(0);
  }

  async function prepareCustomRound(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (customQuestions !== "ready") return;
    const question = questionDraft.replace(/\s+/g, " ").trim();
    if (question.length < 8) {
      setPrepareError("Give the model a little more to work with — at least 8 characters.");
      setMode("prepareError");
      return;
    }

    setPrepareError("");
    setMode("preparing");
    try {
      const response = await fetch("/api/fact-packet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json() as Partial<PreparedRound> & { error?: string };
      if (!response.ok || !data.question || !data.reference || !Array.isArray(data.factPacket)) {
        throw new Error(data.error || "That round could not be prepared.");
      }
      setPreparedRound({
        question: data.question,
        reference: data.reference,
        factPacket: data.factPacket,
      });
      setPreparedInCloud(true);
      setMode("local");
    } catch (error) {
      setPrepareError(error instanceof Error ? error.message : "That round could not be prepared.");
      setMode("prepareError");
    }
  }

  function openReadyMadeLocalRound() {
    setPreparedRound({ question: QUESTION, reference: REFERENCE, factPacket: FACT_PACKET });
    setPreparedInCloud(false);
    setMode("local");
  }

  function chooseToken(choice: (typeof choices)[number]) {
    setTokens((current) => [...current, choice.text]);
    if (choice.lane === "drift") setDrift((value) => Math.min(6, value + 1));
    if (choice.lane === "fact") setDrift((value) => Math.max(0, value - 0.2));
    if (choice.rank === 0) setGreedyPicks((value) => value + 1);

    if (step >= ROUND.length - 1) {
      window.setTimeout(() => setMode("result"), 180);
    } else {
      setStep((value) => value + 1);
    }
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Next Token home">
          <span className="brand-mark">N</span>
          <span>NEXT TOKEN</span>
        </a>
        <div className="prototype-badge">
          <span className="status-dot" /> PROTOTYPE ROUND
        </div>
      </header>

      <section className="game-stage" id="top">
        {mode === "intro" && (
          <div className="intro-panel">
            <p className="eyebrow">A game about how language models talk</p>
            <h1>You are the model.</h1>
            <p className="lede">
              Answer a question one token at a time. Big choices are likely.
              Small choices are tempting. Keep moving.
            </p>

            <form className="question-card question-form" onSubmit={prepareCustomRound}>
              <label className="card-label" htmlFor="custom-question">YOUR QUESTION</label>
              <textarea
                id="custom-question"
                value={questionDraft}
                onChange={(event) => setQuestionDraft(event.target.value)}
                maxLength={220}
                rows={3}
                placeholder="Why do we dream?"
              />
              <div className="question-form-footer">
                <span>{questionDraft.length}/220</span>
                <button className="primary-button" type="submit" disabled={customQuestions !== "ready"}>
                  {customQuestions === "ready" ? "PREPARE THIS ROUND" : customQuestions === "checking" ? "CHECKING THE SWITCH…" : "CUSTOM ROUND NEEDS KEY"}
                  {customQuestions === "ready" && <span aria-hidden="true"> →</span>}
                </button>
              </div>
            </form>

            <p className="tiny-note">
              {customQuestions === "off"
                ? "Custom questions are wired but safely off until the server key is connected. The rounds below work now."
                : "One small cloud call prepares the facts · every token choice runs on your device"}
            </p>
            <div className="intro-alternatives">
              <button className="lab-button" onClick={openReadyMadeLocalRound}>
                TRY A READY-MADE LOCAL ROUND <span>REAL MODEL</span>
              </button>
              <button className="lab-button" onClick={startRound}>
                NO-DOWNLOAD CURATED DEMO
              </button>
            </div>
          </div>
        )}

        {mode === "preparing" && (
          <div className="preparing-panel" aria-live="polite">
            <p className="eyebrow">Borrowing a little thinking</p>
            <h1>Loading the facts.</h1>
            <p className="lede">A stronger model is building the factual path. Then the fast little model takes over on your device.</p>
            <div className="preparing-steps" aria-hidden="true">
              <span className="preparing-step preparing-step-active">CHECK QUESTION</span>
              <span className="preparing-step">PACK FACTS</span>
              <span className="preparing-step">START MODEL</span>
            </div>
          </div>
        )}

        {mode === "prepareError" && (
          <div className="prepare-error-panel">
            <p className="eyebrow">No round this time</p>
            <h1>The facts didn’t load.</h1>
            <p className="lede">{prepareError}</p>
            <div className="result-actions">
              <button className="primary-button" onClick={() => setMode("intro")}>TRY ANOTHER QUESTION</button>
              <button className="text-button" onClick={openReadyMadeLocalRound}>PLAY THE READY-MADE ROUND</button>
            </div>
          </div>
        )}

        {mode === "local" && (
          <LocalModelLab
            question={preparedRound.question}
            reference={preparedRound.reference}
            factPacket={preparedRound.factPacket}
            preparedInCloud={preparedInCloud}
            onExit={() => setMode("intro")}
          />
        )}

        {mode === "playing" && (
          <div className="play-panel">
            <div className="play-heading">
              <div>
                <span className="card-label">QUESTION</span>
                <h2>{QUESTION}</h2>
              </div>
              <div className="play-controls">
                <button
                  className="finish-button"
                  onClick={() => setMode("result")}
                  disabled={tokens.length === 0}
                >
                  FINISH
                </button>
                <div className={`timer ${seconds < 10 ? "timer-hot" : ""}`}>
                  <span>{seconds}</span>
                  <small>SEC</small>
                </div>
              </div>
            </div>

            <div className="answer-stream" aria-live="polite">
              {answer || <span className="cursor-copy">Your answer starts here</span>}
              <span className="cursor" aria-hidden="true" />
            </div>

            <div className="token-zone">
              <div className="zone-heading">
                <span>CHOOSE THE NEXT TOKEN</span>
                <span>12 POSSIBILITIES · {tokens.length} CHOSEN</span>
              </div>
              <div className="token-cloud">
                {cloudChoices.map((choice, index) => {
                  const style = {
                    "--token-scale": 0.82 + Math.sqrt(choice.probability),
                    "--token-alpha": 0.52 + choice.probability * 1.2,
                    "--cloud-x": `${CLOUD_X[index]}px`,
                    "--cloud-y": `${CLOUD_Y[index]}px`,
                  } as CSSProperties;
                  return (
                    <button
                      className="token-choice"
                      key={`${step}-${choice.text}`}
                      onClick={() => chooseToken(choice)}
                      style={style}
                      aria-label={`${choice.text.trim() || "punctuation"}, ${Math.round(choice.probability * 100)} percent likely`}
                    >
                      <span>{choice.text.trim() || choice.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="meters" aria-label="Round statistics">
              <div>
                <span>CONTEXT PULL</span>
                <div className="meter-track"><i style={{ width: `${Math.min(100, 18 + step * 2.4)}%` }} /></div>
                <div className="meter-ends"><span>loose</span><span>locked in</span></div>
              </div>
              <div>
                <span>DRIFT</span>
                <div className="meter-track meter-coral"><i style={{ width: `${Math.min(100, drift * 16)}%` }} /></div>
                <div className="meter-ends"><span>on path</span><span>wandering</span></div>
              </div>
            </div>
          </div>
        )}

        {mode === "result" && (
          <div className="result-panel">
            <p className="eyebrow">The distribution has spoken</p>
            <h1>How did your model do?</h1>

            <div className="comparison-grid">
              <article className="answer-card player-card">
                <div className="answer-card-heading">
                  <span>YOUR RUN</span>
                  <span className="answer-chip">{tokens.length} TOKENS</span>
                </div>
                <p>{answer || "No answer escaped the model."}</p>
              </article>
              <article className="answer-card reference-card">
                <div className="answer-card-heading">
                  <span>REFERENCE ANSWER</span>
                  <span className="answer-chip answer-chip-green">FACT PACKET</span>
                </div>
                <p>{REFERENCE}</p>
              </article>
            </div>

            <div className="result-meters" aria-label="Round tendencies">
              <div className="result-meter">
                <div className="result-meter-heading">
                  <span>BIGGEST-TOKEN HABIT</span>
                  <strong>{greedyPull > 72 ? "followed the crowd" : greedyPull > 36 ? "mixed it up" : "went exploring"}</strong>
                </div>
                <div className="result-meter-track"><i style={{ width: `${greedyPull}%` }} /></div>
                <div className="meter-ends"><span>exploring</span><span>always chose biggest</span></div>
              </div>
              <div className="result-meter">
                <div className="result-meter-heading">
                  <span>FACTUAL DRIFT</span>
                  <strong>{driftLevel > 66 ? "deep in the weeds" : driftLevel > 25 ? "context wandered" : "stayed near the facts"}</strong>
                </div>
                <div className="result-meter-track result-meter-coral"><i style={{ width: `${driftLevel}%` }} /></div>
                <div className="meter-ends"><span>on the path</span><span>deep in the weeds</span></div>
              </div>
            </div>

            <div className="result-actions">
              <button className="primary-button" onClick={startRound}>RUN IT AGAIN</button>
              <button className="text-button" onClick={() => setMode("intro")}>BACK TO START</button>
            </div>
          </div>
        )}
      </section>

      <footer>
        <span>One question. Many locally plausible futures.</span>
        <span>First playable slice · curated probability map</span>
      </footer>
    </main>
  );
}
