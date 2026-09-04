import { test, expect, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
import { scoreDoc } from "./score.js";
import { docxToPdf } from "./lib/visual.js";
import { writeDocx } from "./lib/docx.js";

const sample = new URL("./fixtures/sample.docx", import.meta.url).pathname;
let dir: string, pdf: string;
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), "score-")); pdf = docxToPdf(sample, dir); });

test("same document rendered back scores ≥ 95", async () => {
  const r = await scoreDoc(pdf, sample, join(dir, "c1"));
  expect(r.score).toBeGreaterThanOrEqual(95);
});
test("empty docx scores ≤ 10", async () => {
  const empty = join(dir, "empty.docx"); writeDocx([], empty);
  const r = await scoreDoc(pdf, empty, join(dir, "c2"));
  expect(r.score).toBeLessThanOrEqual(10);
});
