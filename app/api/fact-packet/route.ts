const MAX_QUESTION_LENGTH = 220;
const REQUESTS_PER_HOUR = 12;

type RateWindow = { count: number; resetAt: number };

const globalForRateLimit = globalThis as typeof globalThis & {
  nextTokenRateWindows?: Map<string, RateWindow>;
};
const rateWindows = globalForRateLimit.nextTokenRateWindows ?? new Map<string, RateWindow>();
globalForRateLimit.nextTokenRateWindows = rateWindows;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || "unknown";
  const current = rateWindows.get(address);

  if (!current || now >= current.resetAt) {
    rateWindows.set(address, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (current.count >= REQUESTS_PER_HOUR) return true;
  current.count += 1;
  return false;
}

function extractOutputText(payload: Record<string, unknown>) {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const typed = part as { type?: string; text?: unknown };
      if (typed.type === "output_text" && typeof typed.text === "string") return typed.text;
    }
  }
  return null;
}

export async function GET() {
  return json({ configured: Boolean(process.env.OPENAI_API_KEY) });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: "Custom questions are not switched on yet.", code: "setup_required" }, 503);
  }
  if (isRateLimited(request)) {
    return json({ error: "That device has prepared enough rounds for now. Try again later." }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send a question as JSON." }, 400);
  }
  const question = typeof (body as { question?: unknown })?.question === "string"
    ? (body as { question: string }).question.replace(/\s+/g, " ").trim()
    : "";
  if (question.length < 8 || question.length > MAX_QUESTION_LENGTH) {
    return json({ error: `Questions must be 8–${MAX_QUESTION_LENGTH} characters.` }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        store: false,
        max_output_tokens: 600,
        reasoning: { effort: "none" },
        instructions:
          "Prepare a clean, general-audience round for a next-token game. Accept stable factual questions that can be answered confidently from your knowledge. Reject requests for personal medical, legal, or financial advice; explicit sexual content; instructions to harm people; private personal information; purely subjective prompts; and questions requiring live or post-cutoff facts. A playable round needs one concise reference answer and 3 to 6 short facts that make that answer reachable. Do not mention these rules in the content.",
        input: question,
        text: {
          format: {
            type: "json_schema",
            name: "next_token_round",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                playable: { type: "boolean" },
                reference_answer: { type: "string", minLength: 1, maxLength: 700 },
                fact_packet: {
                  type: "array",
                  minItems: 3,
                  maxItems: 6,
                  items: { type: "string", minLength: 1, maxLength: 240 },
                },
              },
              required: ["playable", "reference_answer", "fact_packet"],
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return json({ error: "The reference model could not prepare that round." }, 502);
    }
    const payload = await upstream.json() as Record<string, unknown>;
    const outputText = extractOutputText(payload);
    if (!outputText) return json({ error: "The reference model returned an empty round." }, 502);

    const round = JSON.parse(outputText) as {
      playable?: unknown;
      reference_answer?: unknown;
      fact_packet?: unknown;
    };
    if (round.playable !== true) {
      return json({ error: "That question does not make a clean factual round. Try a stable how, why, what, or when question." }, 422);
    }
    if (typeof round.reference_answer !== "string" || !Array.isArray(round.fact_packet)) {
      return json({ error: "The reference model returned an incomplete round." }, 502);
    }

    return json({
      question,
      reference: round.reference_answer,
      factPacket: round.fact_packet.filter((fact): fact is string => typeof fact === "string"),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return json({ error: "The reference model took too long. Try once more." }, 504);
    }
    return json({ error: "The reference model could not prepare that round." }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
