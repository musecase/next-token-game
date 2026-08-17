import fs from "node:fs";
import { AutoTokenizer } from "@huggingface/transformers";

const modelId = "onnx-community/Qwen3-0.6B-ONNX";
const source = fs.readFileSync(new URL("../app/daily-puzzles.generated.ts", import.meta.url), "utf8");

function readExport(name) {
  const match = source.match(new RegExp(`export const ${name} = ([\\s\\S]*?) as const;`));
  if (!match) throw new Error(`Could not find ${name}.`);
  return JSON.parse(match[1]);
}

const puzzles = readExport("GENERATED_DAILY_PUZZLES");
const sets = readExport("GENERATED_DAILY_SETS");
if (puzzles.length !== 1095) throw new Error(`Expected 1095 puzzles, found ${puzzles.length}.`);
if (sets.length !== 365) throw new Error(`Expected 365 Daily Three sets, found ${sets.length}.`);

const ids = new Set();
const knownIds = new Set(puzzles.map((puzzle) => puzzle.id));
for (const puzzle of puzzles) {
  if (ids.has(puzzle.id)) throw new Error(`Duplicate puzzle id: ${puzzle.id}`);
  ids.add(puzzle.id);
}

for (const set of sets) {
  if (set.puzzleIds.length !== 3) throw new Error(`Daily set ${set.date} does not contain exactly three puzzles.`);
  for (const id of set.puzzleIds) {
    if (!knownIds.has(id)) throw new Error(`Daily set ${set.date} references unknown puzzle ${id}.`);
  }
}

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
else console.log(`Validated ${puzzles.length} targets and ${sets.length} Daily Three sets.`);
