import { test, expect } from "vitest";
import { tokens, f1, textScore, docxText } from "./text.js";
import { writeDocx } from "./docx.js";
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";

test("tokens lowercases and keeps unicode letters/digits", () => {
  expect(tokens("Hello, Wörld! 42 — ok")).toEqual(["hello", "wörld", "42", "ok"]);
});
test("f1 multiset", () => {
  expect(f1(["a", "b", "b"], ["a", "b", "b"])).toBe(1);
  expect(f1(["a", "b"], [])).toBe(0);
  expect(f1([], [])).toBe(1);
  expect(f1(["a", "b", "c", "d"], ["a", "b"])).toBeCloseTo(2 / 3); // P=1, R=0.5
});
test("textScore penalizes reordered columns via bigrams", () => {
  const orig = "one two three four five six seven eight";
  const same = textScore(orig, orig);
  const shuffled = textScore(orig, "one five two six three seven four eight");
  expect(same).toBe(1);
  expect(shuffled).toBeGreaterThan(0.4); expect(shuffled).toBeLessThan(0.7); // unigram 1, bigram ~0
});
test("docxText reads paragraphs back", () => {
  const out = join(mkdtempSync(join(tmpdir(), "t-")), "x.docx");
  writeDocx(["Alpha & beta", "Gamma"], out);
  expect(docxText(out)).toBe("Alpha & beta\nGamma\n");
});
