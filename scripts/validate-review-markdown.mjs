import fs from "node:fs";
import { AutoTokenizer } from "@huggingface/transformers";

const modelId = "onnx-community/Qwen3-0.6B-ONNX";
const reviewPaths = [1, 2, 3, 4].map((number) => new URL(`../daily-three-review-0${number}.md`, import.meta.url));
const source = reviewPaths.map((reviewPath) => fs.readFileSync(reviewPath, "utf8")).join("\n");
const targets = [...source.matchAll(/→ \*\*([^*]+)\*\*/g)].map((match) => match[1]);

if (targets.length !== 1095) {
  throw new Error(`Expected 1095 targets, found ${targets.length}.`);
}

const tokenizer = await AutoTokenizer.from_pretrained(modelId);
const invalid = [];

for (const target of targets) {
  const tokenIds = tokenizer.encode(` ${target}`, { add_special_tokens: false });
  const decoded = tokenizer.decode(tokenIds, { skip_special_tokens: true }).trim();
  if (tokenIds.length !== 1 || decoded.toLowerCase() !== target.toLowerCase()) {
    invalid.push({ target, tokens: tokenIds.length, decoded });
  }
}

if (invalid.length > 0) {
  for (const item of invalid) {
    console.error(`${item.target}: ${item.tokens} tokens, decoded as "${item.decoded}"`);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated all ${targets.length} review targets as exact single tokens.`);
}
