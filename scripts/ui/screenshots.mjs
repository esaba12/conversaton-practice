// UI quality gate screenshots (docs/next/05-UI-UPGRADE.md §6). Coordinator-owned.
// Captures every gallery state at 390, 900 and 1440 px, with reduced motion off and on,
// into artifacts/ui/<branch>/ (ignored by Git). Run against a dev server you started:
//   npm run dev -- --port 3000
//   PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node scripts/ui/screenshots.mjs [--base http://127.0.0.1:3000] [--route /design-preview] [--route /]
// Gallery entries are elements with data-gallery-state="<id>" (surface given by data-surface="room|night").
// Pages without gallery entries are captured whole.
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const option = (name) => args.flatMap((value, index) => (value === name ? [args[index + 1]] : []));
const base = option("--base")[0] ?? "http://127.0.0.1:3000";
const routes = option("--route").length ? option("--route") : ["/design-preview"];
const widths = [390, 900, 1440];
const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim().replace(/[^a-zA-Z0-9._-]/g, "-");
const outDir = `artifacts/ui/${branch}`;
await mkdir(outDir, { recursive: true });

const slug = (value) => value.replace(/^\//, "").replace(/[^a-zA-Z0-9-]+/g, "-") || "root";
const browser = await chromium.launch();
let shots = 0;
const states = new Set();
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const route of routes) {
        await page.goto(new URL(route, base).toString(), { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const entries = page.locator("[data-gallery-state]");
        const count = await entries.count();
        const motion = reducedMotion === "reduce" ? "rm" : "motion";
        if (count === 0) {
          await page.screenshot({ path: `${outDir}/${slug(route)}--${width}--${motion}.png`, fullPage: true });
          shots++;
          continue;
        }
        for (let index = 0; index < count; index++) {
          const entry = entries.nth(index);
          const id = slug((await entry.getAttribute("data-gallery-state")) ?? `state-${index}`);
          const surface = (await entry.getAttribute("data-surface")) ?? "room";
          states.add(id);
          await entry.scrollIntoViewIfNeeded();
          await entry.screenshot({ path: `${outDir}/${id}--${surface}--${width}--${motion}.png` });
          shots++;
        }
      }
      if (errors.length) console.log(`page errors at ${width}px (${reducedMotion}): ${errors.length}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(`Wrote ${shots} screenshots (${states.size} gallery states) to ${outDir}.`);
