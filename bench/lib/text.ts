import { readFileSync } from "node:fs";
import { run } from "./sh.js";

export async function pdfText(pdfPath: string): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdfPath)), useSystemFonts: true, disableFontFace: true, verbosity: 0 });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    pages.push(tc.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join(""));
  }
  await task.destroy(); // pdf.js 6: destroy() lives on the loading task, not the document
  return pages;
}

const unescape = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, "&");

export function docxText(docxPath: string): string {
  const xml = run("unzip", ["-p", docxPath, "word/document.xml"]);
  const out: string[] = [];
  for (const m of xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<\/w:p>|<w:br\/>/g)) {
    if (m[0] === "</w:p>" || m[0] === "<w:br/>") out.push("\n");
    else if (m[0] === "<w:tab/>") out.push(" ");
    else out.push(unescape(m[1] ?? ""));
  }
  return out.join("");
}

export const tokens = (s: string): string[] => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

export function f1(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const count = new Map<string, number>();
  for (const t of a) count.set(t, (count.get(t) ?? 0) + 1);
  let hit = 0;
  for (const t of b) { const c = count.get(t) ?? 0; if (c > 0) { hit++; count.set(t, c - 1); } }
  const p = hit / b.length, r = hit / a.length;
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}

const bigrams = (t: string[]) => t.slice(1).map((x, i) => t[i] + " " + x);

/** mean(unigram F1, bigram F1): bigrams make reading order count without an O(n·m) alignment. */
export function textScore(orig: string, conv: string): number {
  const a = tokens(orig), b = tokens(conv);
  return (f1(a, b) + f1(bigrams(a), bigrams(b))) / 2;
}
