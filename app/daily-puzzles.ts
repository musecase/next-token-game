export type DailyPuzzle = {
  id: string;
  date: string;
  question: string;
  target: string;
  difficulty: "gentle" | "tricky" | "devious";
};

// Pilot set. These stay deliberately small until real-device play establishes
// what "reachable but not obvious" means for the frozen local model.
export const DAILY_PUZZLES: DailyPuzzle[] = [
  {
    id: "migration-moon",
    date: "2026-08-06",
    question: "How do birds know where to migrate?",
    target: "moon",
    difficulty: "tricky",
  },
  {
    id: "leaves-winter",
    date: "2026-08-07",
    question: "Why do leaves change color in autumn?",
    target: "winter",
    difficulty: "gentle",
  },
  {
    id: "tides-sun",
    date: "2026-08-08",
    question: "What causes ocean tides?",
    target: "sun",
    difficulty: "gentle",
  },
  {
    id: "tails-fear",
    date: "2026-08-09",
    question: "Why do dogs wag their tails?",
    target: "fear",
    difficulty: "tricky",
  },
  {
    id: "bread-gas",
    date: "2026-08-10",
    question: "How does bread dough rise?",
    target: "gas",
    difficulty: "gentle",
  },
  {
    id: "sky-ocean",
    date: "2026-08-11",
    question: "Why is the sky blue?",
    target: "ocean",
    difficulty: "tricky",
  },
  {
    id: "popcorn-water",
    date: "2026-08-12",
    question: "What makes popcorn pop?",
    target: "water",
    difficulty: "gentle",
  },
  {
    id: "bees-dance",
    date: "2026-08-13",
    question: "How do bees find flowers?",
    target: "dance",
    difficulty: "tricky",
  },
  {
    id: "william-sea",
    date: "2026-08-14",
    question: "Where was William the Conqueror born?",
    target: "sea",
    difficulty: "devious",
  },
  {
    id: "cats-kitten",
    date: "2026-08-15",
    question: "Why do cats purr?",
    target: "kitten",
    difficulty: "devious",
  },
];

export function puzzleForDate(date: string) {
  const unlocked = DAILY_PUZZLES.filter((puzzle) => puzzle.date <= date);
  return unlocked.find((puzzle) => puzzle.date === date) ?? unlocked.at(-1) ?? DAILY_PUZZLES[0];
}
