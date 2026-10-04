import { pocketCardLines, type PocketCardContent, type PocketCardLine } from "./model";

// L2: draws the card on a canvas and turns it into a PNG entirely in the browser. No fetch, no upload.
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1620;
const PAD = 96;

export type Palette = { background: string; surface: string; ink: string; muted: string; accent: string };
const fallback: Palette = { background: "#f7f5f0", surface: "#fffefb", ink: "#232a28", muted: "#626963", accent: "#345a49" };

// Subset of CanvasRenderingContext2D that the drawing uses, so tests can pass a recording stand-in.
export type CardContext = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textBaseline: CanvasTextBaseline;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
};
export type CardCanvas = { width: number; height: number; getContext(kind: "2d"): CardContext | null; toBlob(callback: (blob: Blob | null) => void, type?: string): void };

// Greedy word wrap. A word wider than the line is split by characters so nothing is cut off.
export function wrapText(text: string, maxWidth: number, measure: (value: string) => number): string[] {
  const lines: string[] = [];
  let line = "";
  const push = () => { if (line) lines.push(line); line = ""; };
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth) { line = candidate; continue; }
    push();
    if (measure(word) <= maxWidth) { line = word; continue; }
    for (const char of word) {
      if (line && measure(line + char) > maxWidth) push();
      line += char;
    }
  }
  push();
  return lines;
}

const styleOf: Record<PocketCardLine["kind"], { font: string; size: number; leading: number; gapBefore: number }> = {
  name: { font: "500 84px Georgia, 'Times New Roman', serif", size: 84, leading: 96, gapBefore: 0 },
  label: { font: "600 28px 'Avenir Next', 'Segoe UI', system-ui, sans-serif", size: 28, leading: 36, gapBefore: 64 },
  body: { font: "400 44px Georgia, 'Times New Roman', serif", size: 44, leading: 62, gapBefore: 12 },
  small: { font: "400 30px 'Avenir Next', 'Segoe UI', system-ui, sans-serif", size: 30, leading: 42, gapBefore: 24 },
};

export function drawPocketCard(ctx: CardContext, card: PocketCardContent, palette: Palette = fallback) {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = palette.surface;
  ctx.fillRect(48, 48, CARD_WIDTH - 96, CARD_HEIGHT - 96);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, CARD_WIDTH - 96, CARD_HEIGHT - 96);
  ctx.textBaseline = "alphabetic";

  const lines = pocketCardLines(card);
  const small = lines.filter((line) => line.kind === "small");
  const footer = small[small.length - 1];
  let y = PAD + 80;
  for (const line of lines) {
    if (line === footer) continue;
    const style = styleOf[line.kind];
    ctx.font = style.font;
    ctx.fillStyle = line.kind === "label" ? palette.accent : line.kind === "small" ? palette.muted : palette.ink;
    y += style.gapBefore;
    for (const part of wrapText(line.text, CARD_WIDTH - PAD * 2, (value) => ctx.measureText(value).width)) {
      ctx.fillText(part, PAD, y);
      y += style.leading;
    }
  }
  if (footer) {
    ctx.font = styleOf.small.font;
    ctx.fillStyle = palette.muted;
    ctx.fillText(footer.text, PAD, CARD_HEIGHT - PAD - 8);
  }
}

// Reads the page's design tokens when there is a DOM; falls back to the same values.
function pagePalette(): Palette {
  if (typeof document === "undefined") return fallback;
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, value: string) => style.getPropertyValue(name).trim() || value;
  return { background: read("--background", fallback.background), surface: read("--surface", fallback.surface), ink: read("--ink", fallback.ink), muted: read("--muted", fallback.muted), accent: read("--sage", fallback.accent) };
}

export async function pocketCardPng(card: PocketCardContent, options: { createCanvas?: () => CardCanvas; palette?: Palette } = {}): Promise<Blob> {
  const canvas = options.createCanvas ? options.createCanvas() : (document.createElement("canvas") as unknown as CardCanvas);
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  drawPocketCard(ctx, card, options.palette ?? pagePalette());
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not make the picture."))), "image/png"));
}

export const pocketCardFileName = (name: string) => `pocket-card-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card"}.png`;

// A local object URL and an anchor click: the file never leaves the device.
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const PRINT_STYLE = "@media print{body *{visibility:hidden!important}[data-pocket-card-print],[data-pocket-card-print] *{visibility:visible!important}[data-pocket-card-print]{position:fixed;left:0;top:0;width:100%;box-shadow:none!important}}";
export function printPocketCard() {
  const style = document.createElement("style");
  style.textContent = PRINT_STYLE;
  document.head.append(style);
  const cleanup = () => { style.remove(); window.removeEventListener("afterprint", cleanup); };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
