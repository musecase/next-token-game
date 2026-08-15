import { GENERATED_DAILY_PUZZLES, GENERATED_DAILY_SETS } from "./daily-puzzles.generated";

export type DailyPuzzle = {
  id: string;
  date: string;
  question: string;
  target: string;
  difficulty: "gentle" | "tricky" | "devious";
};

export type DailyPuzzleSet = {
  date: string;
  puzzleIds: readonly [string, string, string];
};

export const DAILY_START_DATE = GENERATED_DAILY_SETS[0].date;
export const DAILY_PUZZLES: readonly DailyPuzzle[] = GENERATED_DAILY_PUZZLES;
export const DAILY_PUZZLE_SETS: readonly DailyPuzzleSet[] = GENERATED_DAILY_SETS;

const PUZZLES_BY_ID = new Map(DAILY_PUZZLES.map((puzzle) => [puzzle.id, puzzle]));
const DAY_MS = 86_400_000;
const START_MS = Date.parse(`${DAILY_START_DATE}T12:00:00Z`);

function dayOffset(date: string) {
  const parsed = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor((parsed - START_MS) / DAY_MS));
}

export function puzzleSetForDate(date: string) {
  const set = DAILY_PUZZLE_SETS[dayOffset(date) % DAILY_PUZZLE_SETS.length];
  return {
    date,
    puzzles: set.puzzleIds.map((id) => PUZZLES_BY_ID.get(id)).filter((puzzle): puzzle is DailyPuzzle => Boolean(puzzle)),
  };
}

export function isPuzzleInDailySet(date: string, puzzleId: string) {
  if (date < DAILY_START_DATE) return false;
  return puzzleSetForDate(date).puzzles.some((puzzle) => puzzle.id === puzzleId);
}

export function puzzleForDate(date: string) {
  return puzzleSetForDate(date).puzzles[0] ?? DAILY_PUZZLES[0];
}
