/* eslint-disable @typescript-eslint/no-explicit-any -- Transformers.js model outputs are runtime-shaped ONNX records. */
import {
  AutoModelForCausalLM,
  AutoTokenizer,
  DynamicCache,
  Tensor,
  env,
} from "@huggingface/transformers";

const MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";
const CHOICE_COUNT = 12;
const CANDIDATE_POOL = 96;

type LoadMessage = {
  type: "load";
  mode?: "answer" | "steer";
  question: string;
  factPacket: string[];
  target?: string;
};

type ChooseMessage = {
  type: "choose";
  tokenId: number;
};

type IncomingMessage = LoadMessage | ChooseMessage | { type: "dispose" };

type RankedLogit = { id: number; logit: number };

let tokenizer: any = null;
let model: any = null;
let cache: any = null;

env.allowLocalModels = false;
env.useBrowserCache = true;

function send(message: Record<string, unknown>) {
  self.postMessage(message);
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/memory|allocation|buffer|device lost/i.test(message)) {
    return "The browser ran out of working room for this model. Close a few tabs or try a computer with more memory.";
  }
  if (/webgpu|gpu|adapter/i.test(message)) {
    return "WebGPU could not start on this browser or device. Current Chrome or Edge is the safest first try; newer phones can work too.";
  }
  return message || "The local model could not start.";
}

function updateCache(outputs: Record<string, any>) {
  const entries: Record<string, any> = Object.create(null);
  for (const [name, tensor] of Object.entries(outputs)) {
    if (!name.startsWith("present")) continue;
    entries[name.replace("present", "past_key_values")] = tensor;
  }

  if (cache) cache.update(entries);
  else cache = new DynamicCache(entries);
}

function insertCandidate(top: RankedLogit[], candidate: RankedLogit) {
  if (top.length === CANDIDATE_POOL && candidate.logit <= top[top.length - 1].logit) return;

  let low = 0;
  let high = top.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (top[middle].logit < candidate.logit) high = middle;
    else low = middle + 1;
  }
  top.splice(low, 0, candidate);
  if (top.length > CANDIDATE_POOL) top.pop();
}

function rankChoices(logitsTensor: any) {
  const logits = logitsTensor.to("float32");
  const vocabSize = logits.dims.at(-1) as number;
  const offset = logits.data.length - vocabSize;
  const data = logits.data as Float32Array;
  let maximum = -Infinity;
  const top: RankedLogit[] = [];

  for (let id = 0; id < vocabSize; id += 1) {
    const logit = data[offset + id];
    if (logit > maximum) maximum = logit;
    insertCandidate(top, { id, logit });
  }

  let denominator = 0;
  for (let id = 0; id < vocabSize; id += 1) {
    denominator += Math.exp(data[offset + id] - maximum);
  }

  const seen = new Set<string>();
  const choices = [];
  for (const candidate of top) {
    const text = tokenizer.decode([candidate.id], {
      skip_special_tokens: true,
      clean_up_tokenization_spaces: false,
    });
    const display = text.trim();
    const identity = text.toLocaleLowerCase();

    if (!display || /\uFFFD|<[|/]?\w+>/.test(text) || seen.has(identity)) continue;
    seen.add(identity);
    choices.push({
      id: candidate.id,
      text,
      display,
      probability: Math.exp(candidate.logit - maximum) / denominator,
      relative: Math.exp(candidate.logit - top[0].logit),
      rank: choices.length,
    });
    if (choices.length === CHOICE_COUNT) break;
  }

  if (logits !== logitsTensor) logits.dispose();
  return choices;
}

function releaseUnusedOutputs(outputs: Record<string, any>) {
  for (const [name, tensor] of Object.entries(outputs)) {
    if (name.startsWith("present") || name === "logits") continue;
    if (tensor && typeof (tensor as any).dispose === "function") (tensor as any).dispose();
  }
  outputs.logits?.dispose?.();
}

async function runModel(inputIds: any, attentionMask: any) {
  const outputs = await model({
    input_ids: inputIds,
    attention_mask: attentionMask,
    past_key_values: cache,
    num_logits_to_keep: new Tensor("int64", [1n], []),
  });
  updateCache(outputs);
  const choices = rankChoices(outputs.logits);
  releaseUnusedOutputs(outputs);
  return choices;
}

async function loadAndPrefill(
  question: string,
  factPacket: string[],
  mode: "answer" | "steer" = "answer",
  target?: string,
) {
  if (cache) {
    await cache.dispose();
    cache = null;
  }

  if (!tokenizer) {
    send({ type: "status", label: "Fetching the tokenizer…" });
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
  }

  let modelLoadMs = 0;
  if (!model) {
    send({ type: "status", label: "Downloading the 570 MB model…" });
    const loadStarted = performance.now();
    model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
      device: "webgpu",
      dtype: "q4f16",
      progress_callback: (progress: any) => {
        if (progress.status !== "progress_total") return;
        send({
          type: "progress",
          percent: progress.progress,
          loaded: progress.loaded,
          total: progress.total,
        });
      },
    });
    modelLoadMs = performance.now() - loadStarted;
  }

  send({ type: "status", label: mode === "steer" ? "Setting the starting distribution…" : "Giving the model its fact packet…" });
  const messages = mode === "steer"
    ? [
        {
          role: "system",
          content:
            "Answer the question naturally and directly. You may use relevant comparisons or associations. Output the answer only.",
        },
        { role: "user", content: question },
      ]
    : [
        {
          role: "system",
          content:
            "Answer briefly and directly. Use only the trusted fact packet. Do not mention the packet. Output the answer only.",
        },
        {
          role: "user",
          content: `Trusted fact packet:\n${factPacket.map((fact) => `- ${fact}`).join("\n")}\n\nQuestion: ${question}`,
        },
      ];
  const prompt = tokenizer.apply_chat_template(
    messages,
    {
      add_generation_prompt: true,
      return_dict: true,
      return_tensor: true,
      enable_thinking: false,
    } as any,
  );

  const prefillStarted = performance.now();
  const choices = await runModel(prompt.input_ids, prompt.attention_mask);
  const prefillMs = performance.now() - prefillStarted;

  send({ type: "ready", choices, modelLoadMs, prefillMs, model: "Qwen3 0.6B · q4f16", target });
}

async function chooseToken(tokenId: number) {
  if (!model || !tokenizer || !cache) throw new Error("The model is not ready yet.");

  const started = performance.now();
  const inputIds = new Tensor("int64", [BigInt(tokenId)], [1, 1]);
  const sequenceLength = cache.get_seq_length() + 1;
  const maskData = new BigInt64Array(sequenceLength);
  maskData.fill(1n);
  const attentionMask = new Tensor("int64", maskData, [1, sequenceLength]);
  const choices = await runModel(inputIds, attentionMask);
  send({ type: "choices", choices, latencyMs: performance.now() - started });
}

self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  try {
    if (event.data.type === "load") {
      await loadAndPrefill(event.data.question, event.data.factPacket, event.data.mode, event.data.target);
    } else if (event.data.type === "choose") {
      await chooseToken(event.data.tokenId);
    } else if (event.data.type === "dispose") {
      await cache?.dispose?.();
      await model?.dispose?.();
      cache = null;
      model = null;
      tokenizer = null;
    }
  } catch (error) {
    send({ type: "error", message: friendlyError(error) });
  }
};
