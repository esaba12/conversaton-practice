import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// W10 acceptance 8: the stand-in's reserved face, PAL and voice ids stay on the server.
// This is the source-level half, which always runs; scripts/check-standin-bundle.mjs greps the
// built client bundle after `npm run build`.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENV_NAMES = ["TAVUS_STANDIN_PAL_ID", "TAVUS_STANDIN_FACE_ID", "ELEVENLABS_STANDIN_VOICE_ID"];
const SKIP = new Set(["node_modules", ".next", ".git", "artifacts", "docs", "supabase", "tests", "scripts", "website"]);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const absolute = join(dir, entry);
    if (statSync(absolute).isDirectory()) walk(absolute, acc);
    else if (/\.(ts|tsx)$/.test(absolute)) acc.push(absolute);
  }
  return acc;
}

const sources = walk(ROOT).map((file) => ({ path: relative(ROOT, file).split("\\").join("/"), text: readFileSync(file, "utf8") }));

describe("stand-in media ids never reach the browser", () => {
  it("is read only by modules that import server-only", () => {
    const offenders = sources
      .filter(({ text }) => ENV_NAMES.some((name) => text.includes(name)))
      .filter(({ text }) => !/^import "server-only";/m.test(text))
      .map(({ path }) => path);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("is never exposed through a NEXT_PUBLIC_ variable or a client module", () => {
    for (const { path, text } of sources) {
      expect(text, path).not.toMatch(/NEXT_PUBLIC_[A-Z_]*STANDIN/);
      if (/^"use client";/m.test(text)) {
        for (const name of ENV_NAMES) expect(text, path).not.toContain(name);
        expect(text, path).not.toMatch(/standInMedia/);
      }
    }
  });

  it("keeps the stand-in context builder out of every client module", () => {
    const clientImporters = sources
      .filter(({ text }) => /^"use client";/m.test(text) && /stand-in-context/.test(text))
      .map(({ path }) => path);
    expect(clientImporters, clientImporters.join("\n")).toEqual([]);
  });

  it("greps the built client bundle when one is present", () => {
    const bundle = join(ROOT, ".next", "static");
    if (!existsSync(bundle)) return;
    const files: string[] = [];
    const collect = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const absolute = join(dir, entry);
        if (statSync(absolute).isDirectory()) collect(absolute);
        else if (/\.(js|mjs|json|css|map|txt)$/.test(absolute)) files.push(absolute);
      }
    };
    collect(bundle);
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const name of ENV_NAMES) {
        const value = process.env[name];
        if (text.includes(name) || (value && value.length >= 8 && text.includes(value))) hits.push(`${relative(ROOT, file)} contains ${name}`);
      }
    }
    expect(hits, hits.join("\n")).toEqual([]);
  });
});
