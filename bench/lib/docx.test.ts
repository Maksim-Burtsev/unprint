import { test, expect } from "vitest";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeDocx } from "./docx.js";
import { run } from "./sh.js";

test("writeDocx produces a zip with document.xml containing the paragraphs", () => {
  const dir = mkdtempSync(join(tmpdir(), "docx-"));
  const out = join(dir, "a.docx");
  writeDocx(["Hello world", "Second <p> & done"], out);
  expect(existsSync(out)).toBe(true);
  const xml = run("unzip", ["-p", out, "word/document.xml"]);
  expect(xml).toContain("<w:t xml:space=\"preserve\">Hello world</w:t>");
  expect(xml).toContain("Second &lt;p&gt; &amp; done");
});
