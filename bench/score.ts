import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { pdfText, docxText, textScore } from "./lib/text.js";
import { rasterize, docxToPdf, visualScore } from "./lib/visual.js";
import type { Engine } from "./engines/types.js";
import { buildReport } from "./report/build.js";

const ROOT = dirname(fileURLToPath(import.meta.url));           // bench/
const FILES = join(ROOT, "corpus", "files"), RESULTS = join(ROOT, "results");
type Entry = { id: string; url: string; class: string; pages: number; license: string };
export type DocResult = { id: string; class: string; pages: number; text: number; visual: number; score: number; ms: number; error?: string };
export type Results = { engine: string; date: string; docs: DocResult[] };

/** Pure scorer: original PDF vs produced DOCX. cacheDir holds the DOCX→PDF and both rasters. */
export async function scoreDoc(pdf: string, docx: string, cacheDir: string, origRasterDir = join(cacheDir, "orig")) {
  const convPdf = docxToPdf(docx, cacheDir);
  const text = textScore((await pdfText(pdf)).join("\n"), docxText(docx));
  const visual = visualScore(rasterize(pdf, origRasterDir), rasterize(convPdf, join(cacheDir, "conv")));
  return { text, visual, score: 100 * (0.6 * text + 0.4 * visual) };
}

/** Previous run of this engine, so a --only/--limit run keeps the documents it did not touch. */
function readExisting(engine: string): DocResult[] {
  const file = join(RESULTS, `${engine}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Results).docs : [];
}

function mergeResults(engine: string, fresh: DocResult[], old: DocResult[]): Results {
  const byId = new Map(old.map((d) => [d.id, d]));
  for (const d of fresh) byId.set(d.id, d);
  return { engine, date: new Date().toISOString(), docs: [...byId.values()] };
}

/** Markdown table, one row per class plus `all` — pasted into the step report as is. */
function printTable(docs: DocResult[]): void {
  const row = (name: string, ds: DocResult[]) => {
    const mean = (f: (d: DocResult) => number) => (ds.length ? ds.reduce((s, d) => s + f(d), 0) / ds.length : 0);
    return `| ${name} | ${ds.length} | ${mean((d) => d.score).toFixed(1)} | ${mean((d) => d.text).toFixed(3)} | ${mean((d) => d.visual).toFixed(3)} | ${ds.filter((d) => d.error).length} |`;
  };
  console.log("\n| class | n | score | text | visual | errors |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  for (const c of [...new Set(docs.map((d) => d.class))].sort()) console.log(row(c, docs.filter((d) => d.class === c)));
  console.log(row("all", docs));
}

async function main() {
  const { values } = parseArgs({ options: { engine: { type: "string" }, only: { type: "string" }, limit: { type: "string" }, "no-cache": { type: "boolean" } } });
  if (!values.engine) throw new Error("usage: npm run bench -- --engine <name> [--only id] [--limit n] [--no-cache]");
  const engine = (await import(`./engines/${values.engine}.ts`)).default as Engine;
  let entries = JSON.parse(readFileSync(join(ROOT, "corpus", "manifest.json"), "utf8")) as Entry[];
  if (values.only) entries = entries.filter((e) => e.id === values.only);
  if (values.limit) entries = entries.slice(0, +values.limit);
  const outDir = join(RESULTS, values.engine); mkdirSync(outDir, { recursive: true });
  const docs: DocResult[] = [];
  for (const e of entries) {
    const pdf = join(FILES, `${e.id}.pdf`), docx = join(outDir, `${e.id}.docx`), t0 = Date.now();
    const base = { id: e.id, class: e.class, pages: e.pages };
    try {
      if (!existsSync(pdf)) throw new Error("missing PDF; run npm run corpus:fetch");
      if (values["no-cache"] || !existsSync(docx)) { rmSync(join(outDir, e.id), { recursive: true, force: true }); await engine(pdf, docx); }
      const r = await scoreDoc(pdf, docx, join(outDir, e.id), join(RESULTS, "orig", e.id));
      docs.push({ ...base, ...r, ms: Date.now() - t0 });
    } catch (err) {
      docs.push({ ...base, text: 0, visual: 0, score: 0, ms: Date.now() - t0, error: String((err as Error).message).slice(0, 300) });
    }
    const d = docs.at(-1)!; console.log(`${d.id.padEnd(28)} ${d.class.padEnd(9)} ${d.score.toFixed(1).padStart(5)} ${d.error ? "ERR " + d.error : ""}`);
  }
  // ponytail: sequential; soffice + pdf2docx dominate (~5 s/doc → ~10 min for 120 docs). Parallelize with per-worker soffice profiles if it hurts.
  const merged = mergeResults(values.engine, docs, values.only || values.limit ? readExisting(values.engine) : []);
  writeFileSync(join(RESULTS, `${values.engine}.json`), JSON.stringify(merged, null, 1));
  printTable(merged.docs);
  buildReport();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error(e.message); process.exit(1); });
