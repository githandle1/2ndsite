#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "@huggingface/transformers";

import { parseJsonl } from "./caption-compositions.mjs";
import {
  SEMANTIC_MODEL,
  SEMANTIC_MODEL_DTYPE,
  semanticText,
} from "../lib/compositions/semantic-search.mjs";

const input = resolve(process.argv[2] || "compositions/data/seed/commons-seed.jsonl");
const output = resolve(process.argv[3] || "compositions/data/seed/semantic-index.json");
const records = parseJsonl(await readFile(input, "utf8"));

console.log(`loading ${SEMANTIC_MODEL} (${SEMANTIC_MODEL_DTYPE})…`);
const embed = await pipeline("feature-extraction", SEMANTIC_MODEL, {
  dtype: SEMANTIC_MODEL_DTYPE,
});

const vectors = {};
for (const [position, record] of records.entries()) {
  const result = await embed(semanticText(record), { pooling: "mean", normalize: true });
  vectors[record.id] = Array.from(result.data, (value) => Number(value.toFixed(7)));
  console.log(`${position + 1}/${records.length} ${record.id}`);
}

await writeFile(
  output,
  `${JSON.stringify(
    {
      model: SEMANTIC_MODEL,
      dtype: SEMANTIC_MODEL_DTYPE,
      dimensions: 384,
      generated_at: new Date().toISOString(),
      vectors,
    },
    null,
    2,
  )}\n`,
);
console.log(`wrote ${records.length} vectors to ${output}`);
