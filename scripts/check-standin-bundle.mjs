#!/usr/bin/env node
// W10 acceptance 8: the stand-in's reserved face, PAL and voice ids never reach the browser.
//
// Run after `npm run build`:
//   node scripts/check-standin-bundle.mjs
//
// Greps the client bundle for the env names and, when they are present in this shell, for their
// values. Values are never printed: a failure reports the file and which name matched.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const bundle = join(root, ".next", "static");
const starters = ["ROOMMATE", "PROFESSOR", "DECLINE", "MANAGER"];
const names = ["TAVUS_STANDIN_PAL_ID", "TAVUS_STANDIN_FACE_ID", "ELEVENLABS_STANDIN_VOICE_ID", "TAVUS_PAL_ID", "TAVUS_FACE_ID", "ELEVENLABS_VOICE_ID",
  ...starters.flatMap((p) => [`TAVUS_STARTER_${p}_FACE_ID`, `TAVUS_STARTER_${p}_PAL_ID`, `ELEVENLABS_STARTER_${p}_VOICE_ID`])];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    if (statSync(absolute).isDirectory()) walk(absolute, acc);
    else acc.push(absolute);
  }
  return acc;
}

let files;
try {
  files = walk(bundle);
} catch {
  console.error("No .next/static directory. Run `npm run build` first.");
  process.exit(2);
}

const needles = names.flatMap((name) => {
  const value = process.env[name];
  // A short value would match by accident; only check ids long enough to be meaningful.
  return [{ name, needle: name }, ...(value && value.length >= 8 ? [{ name, needle: value }] : [])];
});
const checkedValues = names.filter((name) => (process.env[name] ?? "").length >= 8);

const failures = [];
for (const file of files) {
  if (!/\.(js|mjs|json|css|map|txt)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const { name, needle } of needles) {
    if (text.includes(needle)) failures.push(`${relative(root, file)} contains ${name}`);
  }
}

console.log(`Scanned ${files.length} files in .next/static for ${names.length} provider env names` +
  (checkedValues.length ? ` and ${checkedValues.length} configured value(s)` : " (no values set in this shell)"));
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log("PASS no provider media id reached the client bundle");
