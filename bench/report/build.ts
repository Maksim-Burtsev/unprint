import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../lib/sh.js";
import type { DocResult, Results } from "../score.js";

const ROOT = dirname(fileURLToPath(import.meta.url));                     // bench/report/
const RESULTS = join(ROOT, "..", "results"), FILES = join(ROOT, "..", "corpus", "files");
const MANIFEST = join(ROOT, "..", "corpus", "manifest.json"), THUMBS = join(ROOT, "thumbs");

const ENT: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ENT[c]!);
const mean = (ds: DocResult[], f: (d: DocResult) => number) => (ds.length ? ds.reduce((s, d) => s + f(d), 0) / ds.length : 0);
/** Cell background, linear white (score 0) → green (score 100). */
const bg = (score: number) => { const v = 255 - Math.round(1.3 * Math.max(0, Math.min(100, score))); return `background:rgb(${v},255,${v})`; };

/** First page at 40 dpi → thumbs/<dir>/<id>.png; returns the relative src, or null when there is no PDF to render.
 *  ponytail: only the worst-10 documents are rendered, since they are the only ones the report shows. */
function thumb(pdf: string, dir: string, id: string): string | null {
  const out = join(THUMBS, dir, id), rel = `thumbs/${dir}/${id}.png`;
  if (existsSync(`${out}.png`)) return rel;
  if (!existsSync(pdf)) return null;
  mkdirSync(join(THUMBS, dir), { recursive: true });
  try {
    run("pdftoppm", ["-png", "-r", "40", "-f", "1", "-l", "1", "-singlefile", pdf, out]);
  } catch {
    return null;
  }
  return existsSync(`${out}.png`) ? rel : null;
}

const thumbCell = (src: string | null, note: string) => (src ? `<td><img src="${src}" alt=""></td>` : `<td><div class="missing">${esc(note)}</div></td>`);

const CSS = `body{font:13px/1.4 -apple-system,Segoe UI,sans-serif;margin:24px;color:#222}
h1{margin:0 0 4px}h2{margin:32px 0 8px;border-bottom:1px solid #ddd}h3{margin:20px 0 6px;font-family:monospace}
p.meta{color:#666;margin:0 0 8px}
table{border-collapse:collapse;margin-bottom:8px}
th,td{border:1px solid #ccc;padding:3px 7px;text-align:right;white-space:nowrap}
th{background:#f2f2f2}td:first-child,th:first-child,td.err{text-align:left}
td.id{font-family:monospace}
span.sub{color:#555;font-size:11px}
td.err{color:#a00;max-width:280px;white-space:normal;font-size:11px}
img{max-width:240px;border:1px solid #ccc;display:block}
div.missing{width:240px;padding:8px;box-sizing:border-box;background:#eee;border:1px solid #ccc;color:#a00;font-size:11px;white-space:normal}`;

export function buildReport(): void {
  if (!existsSync(RESULTS)) return;
  const results = readdirSync(RESULTS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(RESULTS, f), "utf8")) as Results)
    .sort((a, b) => a.engine.localeCompare(b.engine));
  if (results.length === 0) return;

  const manifest: { id: string; license: string }[] = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : [];
  const license = new Map(manifest.map((e) => [e.id, e.license]));
  // One row per document; a document scored by several engines keeps the metadata of the first.
  const all = [...new Map(results.flatMap((r) => r.docs).map((d) => [d.id, d])).values()]
    .sort((a, b) => a.class.localeCompare(b.class) || a.id.localeCompare(b.id));
  const byEngine = results.map((r) => new Map(r.docs.map((d) => [d.id, d])));

  const summaryRow = (name: string, pick: (d: DocResult) => boolean) => {
    const cells = results.map((r) => {
      const ds = r.docs.filter(pick), s = mean(ds, (d) => d.score);
      return `<td style="${bg(s)}">${s.toFixed(1)} <span class="sub">(${mean(ds, (d) => d.text).toFixed(2)}/${mean(ds, (d) => d.visual).toFixed(2)})</span></td>`;
    });
    return `<tr><td>${esc(name)}</td><td>${all.filter(pick).length}</td>${cells.join("")}</tr>`;
  };
  const classes = [...new Set(all.map((d) => d.class))].sort();
  const summary = `<table>
<tr><th>class</th><th>n</th>${results.map((r) => `<th>${esc(r.engine)}<br><span class="sub">score (text/visual)</span></th>`).join("")}</tr>
${classes.map((c) => summaryRow(c, (d) => d.class === c)).join("\n")}
${summaryRow("all", () => true)}
</table>`;

  const worst = results
    .map((r) => {
      const rows = [...r.docs]
        .sort((a, b) => a.score - b.score)
        .slice(0, 10)
        .map((d) => {
          const orig = thumb(join(FILES, `${d.id}.pdf`), "orig", d.id);
          const conv = thumb(join(RESULTS, r.engine, d.id, `${d.id}.pdf`), r.engine, d.id);
          return `<tr><td class="id">${esc(d.id)}</td><td>${esc(d.class)}</td><td>${d.score.toFixed(1)}</td><td class="err">${esc(d.error ?? "")}</td>${thumbCell(orig, "no original PDF")}${thumbCell(conv, d.error ?? "no converted PDF")}</tr>`;
        });
      return `<h3>${esc(r.engine)}</h3>
<table>
<tr><th>id</th><th>class</th><th>score</th><th>error</th><th>original</th><th>converted</th></tr>
${rows.join("\n")}
</table>`;
    })
    .join("\n");

  const docRows = all.map((d) => {
    const cells = byEngine.map((m) => {
      const e = m.get(d.id);
      return e ? `<td style="${bg(e.score)}">${e.score.toFixed(1)}</td><td>${e.text.toFixed(3)}</td><td>${e.visual.toFixed(3)}</td><td>${e.ms}</td>` : "<td></td><td></td><td></td><td></td>";
    });
    return `<tr><td class="id">${esc(d.id)}</td><td>${esc(d.class)}</td><td>${d.pages}</td><td>${esc(license.get(d.id) ?? "")}</td>${cells.join("")}</tr>`;
  });
  const docs = `<table>
<tr><th rowspan="2">id</th><th rowspan="2">class</th><th rowspan="2">pages</th><th rowspan="2">license</th>${results.map((r) => `<th colspan="4">${esc(r.engine)}</th>`).join("")}</tr>
<tr>${results.map(() => "<th>score</th><th>text</th><th>visual</th><th>ms</th>").join("")}</tr>
${docRows.join("\n")}
</table>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>unprint benchmark</title><style>
${CSS}
</style></head><body>
<h1>unprint benchmark</h1>
<p class="meta">generated ${new Date().toISOString()} &middot; corpus ${manifest.length || all.length} documents &middot; engines: ${esc(results.map((r) => r.engine).join(", "))}</p>
<h2>Summary by class</h2>
${summary}
<h2>Worst 10 per engine</h2>
${worst}
<h2>All documents</h2>
${docs}
</body></html>
`;
  const out = join(ROOT, "index.html");
  writeFileSync(out, html);
  console.log(`report: ${out}`);
}
