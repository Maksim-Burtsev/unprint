import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { run } from "./sh.js";

/** PDF text layers carry C0 controls (broken ToUnicode maps on ligatures); they are illegal in
 *  XML 1.0, so an unstripped one makes document.xml malformed and LibreOffice rejects the DOCX. */
const esc = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

/** Minimal DOCX: one plain paragraph per string. No styles, no `docx` npm — this is the bench floor and the test fixture. */
export function writeDocx(paragraphs: string[], out: string): void {
  const body = paragraphs.map((p) => `<w:p><w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r></w:p>`).join("");
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`;
  const dir = mkdtempSync(join(tmpdir(), "docx-"));
  mkdirSync(join(dir, "_rels")); mkdirSync(join(dir, "word"));
  writeFileSync(join(dir, "[Content_Types].xml"), CONTENT_TYPES);
  writeFileSync(join(dir, "_rels", ".rels"), RELS);
  writeFileSync(join(dir, "word", "document.xml"), doc);
  rmSync(out, { force: true });
  run("zip", ["-q", "-X", "-r", resolve(out), "[Content_Types].xml", "_rels", "word"], { cwd: dir });
  rmSync(dir, { recursive: true, force: true });
}
