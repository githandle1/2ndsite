#!/usr/bin/env node

import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

function parseArgs(argv) {
  const values = { ocr: true };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--input") values.input = argv[++index];
    else if (argument === "--output") values.output = argv[++index];
    else if (argument === "--no-ocr") values.ocr = false;
    else throw new Error(`unknown argument: ${argument}`);
  }
  if (!values.input || !values.output) {
    throw new Error("usage: caption-compositions --input candidates.jsonl --output seed.jsonl [--no-ocr]");
  }
  return values;
}

export function parseJsonl(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`invalid JSON on line ${index + 1}: ${error.message}`);
      }
    });
}

function sentence(value = "") {
  const clean = String(value).trim().replace(/\s+/g, " ");
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

export function buildLongCaption(candidate) {
  if (candidate.caption_long) return sentence(candidate.caption_long);
  const parts = [
    candidate.composition && `Composition: ${sentence(candidate.composition)}`,
    candidate.subject && `Subject: ${sentence(candidate.subject)}`,
    candidate.materials && `Materials and surface: ${sentence(candidate.materials)}`,
    candidate.light && `Light: ${sentence(candidate.light)}`,
    candidate.color && `Color: ${sentence(candidate.color)}`,
    candidate.mood && `Mood: ${sentence(candidate.mood)}`,
    candidate.readable_text && `Readable text: ${sentence(candidate.readable_text)}`,
  ].filter(Boolean);
  if (parts.length < 4) {
    throw new Error(`${candidate.id || candidate.title}: add a caption_long or at least four visual fields`);
  }
  return parts.join(" ");
}

export function buildShortCaption(candidate, longCaption) {
  if (candidate.caption_short) return sentence(candidate.caption_short);
  const subject = candidate.subject || longCaption.split(/[.!?]/, 1)[0];
  return sentence(subject.split(/\s+/).slice(0, 24).join(" "));
}

async function commandExists(command) {
  const paths = (process.env.PATH || "").split(":");
  for (const path of paths) {
    try {
      await access(join(path, command), constants.X_OK);
      return true;
    } catch {
      // Keep looking.
    }
  }
  return false;
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise(stdout.trim());
      else reject(new Error(stderr.trim() || `${command} exited ${code}`));
    });
  });
}

async function localImage(imageUrl, directory) {
  if (/^https?:/.test(imageUrl)) {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "mayasthinking-compositions-caption/1.0" },
    });
    if (!response.ok) throw new Error(`image download returned ${response.status}`);
    const extension = extname(new URL(imageUrl).pathname) || ".img";
    const path = join(directory, `source${extension}`);
    await writeFile(path, Buffer.from(await response.arrayBuffer()));
    return path;
  }
  return resolve(imageUrl);
}

export async function runOcr(candidate, enabled = true) {
  if (!enabled) return { text: null, status: "not-run" };
  if (!(await commandExists("tesseract"))) return { text: null, status: "unavailable" };
  const imageUrl = candidate.image_url || candidate.thumbnail_url;
  if (!imageUrl) return { text: null, status: "no-image" };

  const directory = await mkdtemp(join(tmpdir(), "compositions-ocr-"));
  try {
    const image = await localImage(imageUrl, directory);
    const text = await run("tesseract", [image, "stdout", "--psm", "11"]);
    return { text: text || null, status: text ? "detected" : "none-detected" };
  } catch (error) {
    return { text: null, status: `failed: ${error.message}` };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function captionCandidate(candidate, options = {}) {
  const captionLong = buildLongCaption(candidate);
  const ocr = candidate.ocr_status
    ? { text: candidate.ocr_text ?? null, status: candidate.ocr_status }
    : await runOcr(candidate, options.ocr);
  return {
    id: candidate.id,
    source: candidate.source,
    source_url: candidate.source_url,
    image_url: candidate.image_url,
    thumbnail_url: candidate.thumbnail_url,
    title: candidate.title,
    credit: candidate.credit,
    license: candidate.license,
    license_url: candidate.license_url,
    license_note: candidate.license_note,
    retrieved_at: candidate.retrieved_at || new Date().toISOString(),
    provenance: candidate.provenance,
    ocr_text: ocr.text,
    ocr_status: ocr.status,
    caption_long: captionLong,
    caption_short: buildShortCaption(candidate, captionLong),
    width: candidate.width ?? null,
    height: candidate.height ?? null,
    category: candidate.category || "uncategorized",
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const candidates = parseJsonl(await readFile(resolve(options.input), "utf8"));
  const records = [];
  for (const candidate of candidates) {
    records.push(await captionCandidate(candidate, options));
  }
  const output = `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
  await writeFile(resolve(options.output), output);
  console.log(`captioned ${records.length} images → ${basename(options.output)}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
