import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extract } from "@unprint/engine";
import { pdfText, tokens, f1 } from "./lib/text.js";

/** Step-02 done-criteria: extract() over the full corpus without throwing, median ms/page, and unigram F1 of
 *  run text vs raw pdf.js text (proves merging loses nothing). Reading order is not judged here — that is the bench. */
const ROOT = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(ROOT, "corpus", "manifest.json"), "utf8")) as { id: string; class: string }[];
const rows: { id: string; cls: string; pages: number; msPage: number; f1: number; error?: string }[] = [];
const perPage: number[] = [];
for (const e of manifest) {
  const file = join(ROOT, "corpus", "files", `${e.id}.pdf`);
  if (!existsSync(file)) continue;
  try {
    const buf = readFileSync(file);
    const t0 = performance.now();
    const pages = await extract(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const ms = performance.now() - t0;
    const ours = tokens(pages.map((p) => p.runs.map((r) => r.text).join(" ")).join("\n"));
    const ref = tokens((await pdfText(file)).join("\n"));
    perPage.push(...pages.map(() => ms / pages.length));
    rows.push({ id: e.id, cls: e.class, pages: pages.length, msPage: ms / pages.length, f1: f1(ref, ours) });
  } catch (err) { rows.push({ id: e.id, cls: e.class, pages: 0, msPage: 0, f1: 0, error: (err as Error).message }); }
}
const sorted = [...perPage].sort((a, b) => a - b), median = sorted[sorted.length >> 1] ?? 0;
const ok = rows.filter((r) => !r.error), mean = ok.reduce((s, r) => s + r.f1, 0) / ok.length;
for (const r of rows) console.log(`${r.id.padEnd(34)} ${r.cls.padEnd(9)} ${String(r.pages).padStart(3)}p ${r.msPage.toFixed(1).padStart(7)} ms/p  F1 ${r.f1.toFixed(3)}${r.error ? "  ERROR " + r.error : ""}`);
console.log(`\n${rows.length} docs, ${perPage.length} pages · median ${median.toFixed(1)} ms/page · mean unigram F1 ${mean.toFixed(4)} · below 0.98: ${ok.filter((r) => r.f1 < 0.98).map((r) => r.id).join(", ") || "none"} · errors: ${rows.filter((r) => r.error).length}`);
if (rows.some((r) => r.error)) process.exit(1);
