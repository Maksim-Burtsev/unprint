import { test, expect } from "vitest";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeDocx } from "./docx.js";
import { run } from "./sh.js";

test("writeDocx produces a zip with document.xml containing the paragraphs", () => {
  const dir = mkdtempSync(join(tmpdir(), "docx-"));
  const out = join(dir, "a.docx");
  writeDocx(["Hello world", "Second <p> & done", "a\u0002b\u000Fc\u001F"], out);
  expect(existsSync(out)).toBe(true);
  const xml = run("unzip", ["-p", out, "word/document.xml"]);
  expect(xml).toContain("<w:t xml:space=\"preserve\">Hello world</w:t>");
  expect(xml).toContain("Second &lt;p&gt; &amp; done");
  // C0 controls out of a PDF text layer are illegal in XML 1.0: strip, do not escape.
  expect(xml).toContain("<w:t xml:space=\"preserve\">abc</w:t>");
  expect(xml).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
});
