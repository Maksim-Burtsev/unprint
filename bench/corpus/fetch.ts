import { existsSync, mkdirSync, writeFileSync, readFileSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../lib/sh.js";
import { invoiceHtml, resumeHtml, bookHtml, htmlToPdf, truncatePdf, scanPdf } from "./generate.js";

const HERE = dirname(fileURLToPath(import.meta.url)), FILES = join(HERE, "files");
type Entry = { id: string; url: string; class: string; pages: number; license: string };
/** SEC requires a "<name> <email>" User-Agent; a URL-only one is served an HTML error page. */
const UA = "unprint-bench mburtsev17@gmail.com";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
const pageCount = (pdf: string) => +(/Pages:\s+(\d+)/.exec(run("pdfinfo", [pdf]))?.[1] ?? 0);

async function produce(e: Entry, out: string) {
  const tmp = out + ".tmp.pdf";
  if (e.url.startsWith("https://")) {
    writeFileSync(tmp, await download(e.url));
    if (e.url.includes("arxiv.org")) await sleep(3000); // arXiv asks for one request per 3 s
  } else {
    const [, kind, arg] = /^gen:(\w+):(.+)$/.exec(e.url)!;
    if (kind === "invoice") htmlToPdf(invoiceHtml(+arg!), tmp);
    else if (kind === "resume") htmlToPdf(resumeHtml(+arg!), tmp);
    else if (kind === "book") htmlToPdf(bookHtml((await download(`https://www.gutenberg.org/cache/epub/${arg}/pg${arg}.txt`)).toString("utf8")), tmp);
    else if (kind === "html") htmlToPdf((await download(arg!)).toString("utf8"), tmp);
    else if (kind === "scan") {
      const src = join(FILES, `${arg}.pdf`);
      if (!existsSync(src)) throw new Error(`scan source ${arg} missing (ordering)`);
      scanPdf(src, tmp);
    } else throw new Error(`unknown generator ${kind}`);
  }
  if (pageCount(tmp) > e.pages) { truncatePdf(tmp, e.pages, out); rmSync(tmp); } else renameSync(tmp, out);
}

async function main() {
  mkdirSync(FILES, { recursive: true });
  const entries = JSON.parse(readFileSync(join(HERE, "manifest.json"), "utf8")) as Entry[];
  // Scans rasterize a file this same run produces, so they go last.
  const order = [...entries.filter((e) => !e.url.startsWith("gen:scan:")), ...entries.filter((e) => e.url.startsWith("gen:scan:"))];
  let failed = 0;
  for (const e of order) {
    const out = join(FILES, `${e.id}.pdf`);
    if (existsSync(out)) continue;
    try {
      await produce(e, out);
      const n = pageCount(out);
      console.log(`${e.id.padEnd(38)} ${n} pages${n !== e.pages ? ` (manifest says ${e.pages})` : ""}`);
    } catch (err) {
      failed++;
      console.error(`${e.id.padEnd(38)} FAILED: ${(err as Error).message}`);
    }
  }
  console.log(`${entries.length - failed}/${entries.length} files in ${FILES}`);
  process.exit(failed ? 1 : 0);
}
main();
