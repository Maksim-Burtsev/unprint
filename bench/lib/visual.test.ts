import { test, expect } from "vitest";
import { ssim, visualScore, type Gray } from "./visual.js";

const img = (w: number, h: number, f: (x: number, y: number) => number): Gray => {
  const px = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[y * w + x] = f(x, y);
  return { w, h, px };
};
const white = img(64, 64, () => 255);
const text = img(64, 64, (x, y) => ((x >> 2) + (y >> 3)) % 3 === 0 ? 0 : 255); // stripes = "ink"

test("identical images → 1", () => expect(ssim(text, text)).toBeCloseTo(1, 5));
test("blank vs blank → 1 (all windows skipped)", () => expect(ssim(white, white)).toBe(1));
test("ink vs blank → near 0, not ~0.7", () => expect(ssim(text, white)).toBeLessThan(0.1));
test("size mismatch: b is padded with white", () => {
  const half = img(64, 32, (x, y) => text.px[y * 64 + x]!);
  const s = ssim(text, half);
  expect(s).toBeGreaterThan(0.3); expect(s).toBeLessThan(0.7);
});
test("visualScore: missing pages count 0", () => expect(visualScore([text, text], [text])).toBeCloseTo(0.5, 5));
