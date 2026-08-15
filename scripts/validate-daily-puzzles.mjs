import fs from "node:fs";
import { AutoTokenizer } from "@huggingface/transformers";

const modelId = "onnx-community/Qwen3-0.6B-ONNX";
const source = fs.readFileSync(new URL("../app/daily-puzzles.ts", import.meta.url), "utf8");
const puzzles = [...source.matchAll(/id: "([^"]+)"[\s\S]*?date: "([^"]+)"[\s\S]*?target: "([^"]+)"/g)]
  .map(([, id, date, target]) => ({ id, date, target }));

if (puzzles.length === 0) {
  throw new Error("No Daily Steer puzzles were found.");
}

const duplicate = (values) => values.find((value, index) => values.indexOf(value) !== index);
const duplicateId = duplicate(puzzles.map((puzzle) => puzzle.id));
const duplicateDate = duplicate(puzzles.map((puzzle) => puzzle.date));

if (duplicateId) throw new Error(`Duplicate puzzle id: ${duplicateId}`);
if (duplicateDate) throw new Error(`Duplicate puzzle date: ${duplicateDate}`);

const tokenizer = await AutoTokenizer.from_pretrained(modelId);
let failures = 0;

for (const puzzle of puzzles) {
  const tokenIds = tokenizer.encode(` ${puzzle.target}`, { add_special_tokens: false });
  const decoded = tokenizer.decode(tokenIds, { skip_special_tokens: true }).trim();
  const valid = tokenIds.length === 1 && decoded.toLowerCase() === puzzle.target.toLowerCase();

  if (!valid) {
    failures += 1;
    console.error(`Invalid target "${puzzle.target}" (${puzzle.id}): ${tokenIds.length} tokens, decoded as "${decoded}".`);
  }
}

if (failures > 0) process.exitCode = 1;
else console.log(`Validated ${puzzles.length} Daily Steer targets as exact single tokens.`);
