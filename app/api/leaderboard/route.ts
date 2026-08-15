import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isPuzzleInDailySet } from "../../daily-puzzles";
import { cleanArcadeName, validPlayerId } from "../../leaderboard-guard";

type Entry = {
  name: string;
  score: number;
};

let redis: Redis | null = null;
let rateLimit: Ratelimit | null = null;

function leaderboardIsConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis() {
  if (!leaderboardIsConfigured()) return null;
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

function getRateLimit(client: Redis) {
  if (!rateLimit) {
    rateLimit = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(6, "1 m"),
      prefix: "steer:rate",
    });
  }
  return rateLimit;
}

function boardKeys(date: string, puzzleId: string) {
  const suffix = `${date}:${puzzleId}`;
  return {
    scores: `steer:scores:${suffix}`,
    names: `steer:names:${suffix}`,
  };
}

async function getEntries(client: Redis, date: string, puzzleId: string): Promise<Entry[]> {
  const keys = boardKeys(date, puzzleId);
  const raw = await client.zrange<(string | number)[]>(keys.scores, 0, 9, { withScores: true });
  const players: Array<{ id: string; score: number }> = [];

  for (let index = 0; index < raw.length; index += 2) {
    players.push({ id: String(raw[index]), score: Number(raw[index + 1]) });
  }

  const names = await Promise.all(players.map((player) => client.hget<string>(keys.names, player.id)));
  return players.map((player, index) => ({
    name: names[index] ?? "ANON",
    score: player.score,
  }));
}

function validBoard(date: string | null, puzzleId: string | null) {
  return Boolean(date && puzzleId && /^\d{4}-\d{2}-\d{2}$/.test(date) && isPuzzleInDailySet(date, puzzleId));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const puzzleId = searchParams.get("puzzle");

  if (!validBoard(date, puzzleId)) {
    return Response.json({ error: "Unknown daily puzzle." }, { status: 400 });
  }

  const client = getRedis();
  if (!client) return Response.json({ enabled: false, entries: [] });

  const entries = await getEntries(client, date!, puzzleId!);
  return Response.json({ enabled: true, entries });
}

export async function POST(request: Request) {
  const client = getRedis();
  if (!client) return Response.json({ error: "Leaderboard storage is not connected." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : null;
  const puzzleId = typeof body?.puzzleId === "string" ? body.puzzleId : null;
  const score = Number(body?.score);
  const name = cleanArcadeName(body?.name);
  const playerId = body?.playerId;

  if (!validBoard(date, puzzleId) || !Number.isInteger(score) || score < 1 || score > 250 || !name || !validPlayerId(playerId)) {
    return Response.json({ error: name ? "Invalid score submission." : "Choose another arcade name." }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateId = createHash("sha256").update(`${forwarded}:${playerId}`).digest("hex");
  const limit = await getRateLimit(client).limit(rateId);
  if (!limit.success) return Response.json({ error: "Too many score submissions. Try again shortly." }, { status: 429 });

  const keys = boardKeys(date!, puzzleId!);
  const previous = await client.zscore(keys.scores, playerId);
  if (previous === null || score < previous) {
    await Promise.all([
      client.zadd(keys.scores, { score, member: playerId }),
      client.hset(keys.names, { [playerId]: name }),
    ]);
    await client.zremrangebyrank(keys.scores, 100, -1);
  }

  const entries = await getEntries(client, date!, puzzleId!);
  return Response.json({ enabled: true, entries });
}
