import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Paths (posix, repo-relative) exempt from a given rule until another slice owns the fix. */
export const UI_RULES_ALLOW_LIST = {
  moduleCssRawColors: [
    { file: "components/presentation/setup.module.css", reason: "0C presentation refactor; legacy hex fills" },
    { file: "components/presentation/reflection.module.css", reason: "0C presentation refactor; legacy hex fills" },
    { file: "components/presentation/preview.module.css", reason: "0C presentation refactor; legacy hex fills" },
    { file: "components/presentation/practice.module.css", reason: "0C presentation refactor; legacy hex fills" },
    { file: "components/presentation/people.module.css", reason: "0C presentation refactor; legacy hex fills" },
    { file: "components/presentation/data.module.css", reason: "0C presentation refactor; legacy hex fills" },
    { file: "components/presentation/captions.module.css", reason: "0C presentation refactor; legacy hex fallback in var()" },
  ],
  disabledOpacity: [] as { file: string; reason: string }[],
  outlineNoneWithoutFocusVisible: [
    { file: "components/presentation/setup.module.css", reason: "0C presentation refactor; :focus outline removed without :focus-visible yet" },
    { file: "components/presentation/people.module.css", reason: "0C presentation refactor; :focus outline removed without :focus-visible yet" },
  ],
  pureBlackWhite: [] as { file: string; reason: string }[],
  iconImports: [] as { file: string; reason: string }[],
  inlineSvg: [{ file: "components/presentation/practice.tsx", reason: "0C owns call controls; inline SVG icons pending Lucide migration" }],
} as const;

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const absolute = join(dir, name);
    if (statSync(absolute).isDirectory()) walkFiles(absolute, acc);
    else acc.push(absolute);
  }
  return acc;
}

function rel(path: string): string {
  return relative(ROOT, path).split("\\").join("/");
}

function isAllowed(bucket: keyof typeof UI_RULES_ALLOW_LIST, file: string): boolean {
  return UI_RULES_ALLOW_LIST[bucket].some((entry) => entry.file === file);
}

/** Strip :root { … } blocks (including nested @media :root) so token definitions are not scanned. */
export function stripRootBlocks(css: string): string {
  let out = css;
  const rootRe = /:root\s*\{[^}]*\}/g;
  for (let i = 0; i < 8; i++) out = out.replace(rootRe, "");
  return out;
}

/** §2 Never #5 — raw hex or rgb()/rgba() in *.module.css (tokens live in globals.css :root only). */
export function findRawColorsInModuleCss(css: string): { line: number; match: string }[] {
  const hits: { line: number; match: string }[] = [];
  const lines = css.split("\n");
  const re = /#([0-9a-fA-F]{3,8})\b|rgba?\(/;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("/*")) return;
    const m = line.match(re);
    if (m) hits.push({ line: index + 1, match: m[0] });
  });
  return hits;
}

/** §2 Never #6 — opacity inside a :disabled or [aria-disabled] rule. */
export function findDisabledOpacityViolations(css: string): { selector: string; snippet: string }[] {
  const violations: { selector: string; snippet: string }[] = [];
  const re = /([^{]+)\{([^}]*)\}/g;
  for (const match of css.matchAll(re)) {
    const selector = match[1].trim();
    const body = match[2];
    if (!/:disabled|\[aria-disabled[^\]]*\]/i.test(selector)) continue;
    if (/\bopacity\s*:/i.test(body)) violations.push({ selector, snippet: body.trim().slice(0, 80) });
  }
  return violations;
}

/** §2 Never #7 — outline:none / outline:0 without any :focus-visible outline replacement in the same file. */
export function fileHasOutlineNoneWithoutFocusVisible(css: string): boolean {
  const removesFocus = /outline\s*:\s*(none|0)\b/i.test(css);
  if (!removesFocus) return false;
  const replacesFocus = /:focus-visible[^{]*\{[^}]*outline\s*:\s*(?!none|0)/i.test(css);
  return !replacesFocus;
}

const COLOR_PROPERTIES =
  "(?:color|background(?:-color)?|border(?:-color)?|outline-color|fill|stroke|caret-color|column-rule-color|text-decoration-color)";

/** §2 Never #9 — pure black/white as color values (not white-space, not token hex like #fffefb). */
export function findPureBlackWhiteViolations(css: string): { line: number; text: string }[] {
  const scoped = stripRootBlocks(css);
  const hits: { line: number; text: string }[] = [];
  const valueRe = new RegExp(
    `(^|[;{]\\s*)${COLOR_PROPERTIES}\\s*:\\s*(#000000?|#ffffff?|\\bblack\\b|\\bwhite\\b)\\s*[;!]`,
    "gim",
  );
  const lines = scoped.split("\n");
  lines.forEach((line, index) => {
    if (/white-space\s*:/i.test(line)) return;
    valueRe.lastIndex = 0;
    if (valueRe.test(line)) hits.push({ line: index + 1, text: line.trim() });
  });
  return hits;
}

const ICON_IMPORT_RE = /import\s+[^;]*\sfrom\s+["']([^"']+)["']/g;
const LUCIDE_OK = /^lucide-react(\/|$)/;

/** §2 Never #10 — icon imports from packages other than lucide-react. */
export function findNonLucideIconImports(source: string): string[] {
  const bad: string[] = [];
  for (const match of source.matchAll(ICON_IMPORT_RE)) {
    const spec = match[1];
    if (!spec.includes("icon") && !/(?:heroicons|react-icons|@tabler|phosphor)/i.test(spec)) continue;
    if (LUCIDE_OK.test(spec)) continue;
    if (/lucide-react/.test(spec)) continue;
    bad.push(spec);
  }
  return bad;
}

/** §2 Never #10 — inline <svg> in app/components TSX (logo and illustrations allow-listed by path). */
export function findInlineSvg(source: string): boolean {
  return /<svg[\s>/]/i.test(source);
}

describe("UI rules §2 checks (fixture controls)", () => {
  it("#5 flags raw hex in module CSS and ignores token-only globals", () => {
    expect(findRawColorsInModuleCss(".x { color: #1a2b3c; }")).toEqual([{ line: 1, match: "#1a2b3c" }]);
    expect(findRawColorsInModuleCss(".x { box-shadow: var(--shadow-1); }")).toEqual([]);
    expect(findRawColorsInModuleCss(".x { background: rgb(1 2 3 / .5); }")).toEqual([{ line: 1, match: "rgb(" }]);
  });

  it("#6 flags opacity in disabled rules", () => {
    expect(findDisabledOpacityViolations(".btn:disabled { opacity: 0.65; }")).toHaveLength(1);
    expect(findDisabledOpacityViolations('.btn[aria-disabled="true"] { color: var(--muted); }')).toHaveLength(0);
    expect(findDisabledOpacityViolations(".btn:hover { opacity: 1; }")).toHaveLength(0);
  });

  it("#7 flags outline removal without focus-visible replacement", () => {
    expect(fileHasOutlineNoneWithoutFocusVisible(".a:focus { outline: none; }")).toBe(true);
    expect(
      fileHasOutlineNoneWithoutFocusVisible(".a:focus { outline: none; } .a:focus-visible { outline: 3px solid var(--focus); }"),
    ).toBe(false);
  });

  it("#9 flags pure black/white and ignores white-space", () => {
    expect(findPureBlackWhiteViolations(".x { white-space: nowrap; }")).toEqual([]);
    expect(findPureBlackWhiteViolations(".x { background: white; }")).toHaveLength(1);
    expect(findPureBlackWhiteViolations(".x { color: #fffefb; }")).toEqual([]);
    expect(findPureBlackWhiteViolations(":root { --surface: #ffffff; }")).toEqual([]);
  });

  it("#10 flags foreign icon imports and inline svg", () => {
    expect(findNonLucideIconImports('import { X } from "@heroicons/react/24/outline";')).toEqual(["@heroicons/react/24/outline"]);
    expect(findNonLucideIconImports('import { Phone } from "lucide-react";')).toEqual([]);
    expect(findInlineSvg("<svg aria-hidden />")).toBe(true);
    expect(findInlineSvg("<span>No svg</span>")).toBe(false);
  });
});

describe("UI rules §2 checks (repository)", () => {
  const moduleCssFiles = walkFiles(join(ROOT, "app"))
    .concat(walkFiles(join(ROOT, "components")))
    .filter((f) => f.endsWith(".module.css"));
  const cssFiles = walkFiles(join(ROOT, "app"))
    .concat(walkFiles(join(ROOT, "components")))
    .filter((f) => f.endsWith(".css") && !f.endsWith(".module.css"));
  const tsxFiles = walkFiles(join(ROOT, "app"))
    .concat(walkFiles(join(ROOT, "components")))
    .filter((f) => /\.tsx$/.test(f));

  it("#5 no raw colors in module CSS except allow-list", () => {
    const failures: string[] = [];
    for (const file of moduleCssFiles) {
      const r = rel(file);
      if (isAllowed("moduleCssRawColors", r)) continue;
      const hits = findRawColorsInModuleCss(readFileSync(file, "utf8"));
      if (hits.length) failures.push(`${r}:${hits[0].line} (${hits[0].match})`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("#6 no opacity-only disabled styling except allow-list", () => {
    const failures: string[] = [];
    for (const file of [...moduleCssFiles, ...cssFiles.map((f) => f)]) {
      const r = rel(file);
      if (isAllowed("disabledOpacity", r)) continue;
      const hits = findDisabledOpacityViolations(readFileSync(file, "utf8"));
      if (hits.length) failures.push(`${r} (${hits[0].selector})`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("#7 outline:none requires :focus-visible replacement except allow-list", () => {
    const failures: string[] = [];
    for (const file of [...moduleCssFiles, join(ROOT, "app/globals.css")]) {
      const r = rel(file);
      if (isAllowed("outlineNoneWithoutFocusVisible", r)) continue;
      if (fileHasOutlineNoneWithoutFocusVisible(readFileSync(file, "utf8"))) failures.push(r);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("#9 no pure black/white in CSS except allow-list", () => {
    const failures: string[] = [];
    for (const file of [...moduleCssFiles, join(ROOT, "app/globals.css")]) {
      const r = rel(file);
      if (isAllowed("pureBlackWhite", r)) continue;
      const hits = findPureBlackWhiteViolations(readFileSync(file, "utf8"));
      if (hits.length) failures.push(`${r}:${hits[0].line}`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("#10 Lucide-only icons and no inline svg except allow-list", () => {
    const importFailures: string[] = [];
    const svgFailures: string[] = [];
    for (const file of tsxFiles) {
      const r = rel(file);
      const text = readFileSync(file, "utf8");
      if (!isAllowed("iconImports", r)) {
        const bad = findNonLucideIconImports(text);
        if (bad.length) importFailures.push(`${r} → ${bad.join(", ")}`);
      }
      if (!isAllowed("inlineSvg", r) && findInlineSvg(text)) svgFailures.push(r);
    }
    expect(importFailures, importFailures.join("\n")).toEqual([]);
    expect(svgFailures, svgFailures.join("\n")).toEqual([]);
  });
});
