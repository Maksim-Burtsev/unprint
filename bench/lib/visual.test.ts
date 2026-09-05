import { test, expect } from "vitest";
import { inkOverlap, visualScore, type Gray } from "./visual.js";

const img = (w: number, h: number, f: (x: number, y: number) => number): Gray => {
  const px = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[y * w + x] = f(x, y);
  return { w, h, px };
};
const W = 128, H = 128;
/** Page-like ink: text lines every 20 px, each a row of glyph strokes inside margins, so a shift does not wrap. */
const page = (dx = 0, stroke = 4, bottom = H) =>
  img(W, H, (x, y) => {
    const gx = x - dx;
    return y < bottom && y % 20 < 6 && gx >= 12 && gx < W - 20 && (gx - 12) % 8 < stroke ? 0 : 255;
  });
const text = page(), white = img(W, H, () => 255);

test("identical pages → 1", () => expect(inkOverlap(text, text)).toBeCloseTo(1, 5));
test("blank vs blank → 1", () => expect(inkOverlap(white, white)).toBe(1));
test("text vs blank → ~0", () => expect(inkOverlap(text, white)).toBeLessThan(0.05));
test("same text shifted 4 px right still overlaps", () => expect(inkOverlap(text, page(4))).toBeGreaterThan(0.7));
test("bottom half lost → ~half", () => {
  const s = inkOverlap(text, page(0, 4, H / 2));
  expect(s).toBeGreaterThan(0.35); expect(s).toBeLessThan(0.65);
});
test("same layout in a heavier font → still high", () => expect(inkOverlap(text, page(0, 6))).toBeGreaterThan(0.6));
test("visualScore: missing pages count 0", () => expect(visualScore([text, text], [text])).toBeCloseTo(0.5, 5));
