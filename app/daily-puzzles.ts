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
    id: "cats-engine",
    date: "2026-08-15",
    question: "Why do cats purr?",
    target: "engine",
    difficulty: "devious",
  },
  {
    id: "airplanes-feathers",
    date: "2026-08-16",
    question: "How do airplanes stay in the sky?",
    target: "feathers",
    difficulty: "tricky",
  },
  {
    id: "onions-goggles",
    date: "2026-08-17",
    question: "Why do onions make us cry?",
    target: "goggles",
    difficulty: "tricky",
  },
  {
    id: "magnets-compass",
    date: "2026-08-18",
    question: "How do magnets attract and repel?",
    target: "compass",
    difficulty: "gentle",
  },
  {
    id: "snow-rainbow",
    date: "2026-08-19",
    question: "Why does snow look white?",
    target: "rainbow",
    difficulty: "tricky",
  },
  {
    id: "spiders-music",
    date: "2026-08-20",
    question: "How do spiders know something touched their web?",
    target: "music",
    difficulty: "devious",
  },
  {
    id: "rust-blood",
    date: "2026-08-21",
    question: "Why does iron rust?",
    target: "blood",
    difficulty: "tricky",
  },
  {
    id: "chameleons-mood",
    date: "2026-08-22",
    question: "Why do chameleons change color?",
    target: "mood",
    difficulty: "tricky",
  },
  {
    id: "craters-scars",
    date: "2026-08-23",
    question: "Why does the Moon have so many craters?",
    target: "scars",
    difficulty: "devious",
  },
  {
    id: "geckos-hair",
    date: "2026-08-24",
    question: "How can geckos walk on walls?",
    target: "hair",
    difficulty: "gentle",
  },
  {
    id: "helium-guitar",
    date: "2026-08-25",
    question: "Why does helium make a voice sound higher?",
    target: "guitar",
    difficulty: "devious",
  },
  {
    id: "ants-perfume",
    date: "2026-08-26",
    question: "How do ants find their way to food?",
    target: "perfume",
    difficulty: "devious",
  },
  {
    id: "ducks-oil",
    date: "2026-08-27",
    question: "Why can ducks float so easily?",
    target: "oil",
    difficulty: "gentle",
  },
  {
    id: "sunscreen-mirror",
    date: "2026-08-28",
    question: "How does sunscreen protect skin?",
    target: "mirror",
    difficulty: "tricky",
  },
  {
    id: "stars-water",
    date: "2026-08-29",
    question: "Why do stars twinkle?",
    target: "water",
    difficulty: "devious",
  },
  {
    id: "thermos-space",
    date: "2026-08-30",
    question: "How does a thermos keep drinks hot?",
    target: "space",
    difficulty: "gentle",
  },
  {
    id: "seawater-rocks",
    date: "2026-08-31",
    question: "Why is seawater salty?",
    target: "rocks",
    difficulty: "gentle",
  },
  {
    id: "glowsticks-cold",
    date: "2026-09-01",
    question: "How do glow sticks make light?",
    target: "cold",
    difficulty: "gentle",
  },
  {
    id: "velcro-plant",
    date: "2026-09-02",
    question: "How does Velcro stick together?",
    target: "plant",
    difficulty: "devious",
  },
  {
    id: "fireflies-romance",
    date: "2026-09-03",
    question: "Why do fireflies flash?",
    target: "romance",
    difficulty: "devious",
  },
  {
    id: "octopus-television",
    date: "2026-09-04",
    question: "How do octopuses change color?",
    target: "television",
    difficulty: "devious",
  },
];

export function puzzleForDate(date: string) {
  const unlocked = DAILY_PUZZLES.filter((puzzle) => puzzle.date <= date);
  return unlocked.find((puzzle) => puzzle.date === date) ?? unlocked.at(-1) ?? DAILY_PUZZLES[0];
}
