import { test, expect } from "vitest";
import manifest from "./manifest.json" with { type: "json" }; // NodeNext requires the attribute

const CLASSES = ["article", "invoice", "resume", "contract", "form", "slides", "scan", "book"];

test("manifest shape and coverage", () => {
  expect(manifest.length).toBeGreaterThanOrEqual(120);
  expect(new Set(manifest.map((e) => e.id)).size).toBe(manifest.length);
  for (const c of CLASSES) expect(manifest.filter((e) => e.class === c).length, c).toBeGreaterThanOrEqual(10);
  for (const e of manifest) {
    expect(e.id).toMatch(new RegExp(`^${e.class}-[a-z0-9-]+$`));
    expect(e.url).toMatch(/^(https:\/\/|gen:(invoice|resume|book|html|scan):)/);
    expect(e.pages).toBeGreaterThan(0); expect(e.pages).toBeLessThanOrEqual(12);
    expect(e.license.length).toBeGreaterThan(3);
  }
  const ids = new Set(manifest.map((e) => e.id));
  for (const e of manifest.filter((e) => e.url.startsWith("gen:scan:"))) expect(ids.has(e.url.slice(9))).toBe(true);
});
