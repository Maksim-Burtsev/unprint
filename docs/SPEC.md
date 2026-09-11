# unprint — product and architecture spec

## Product

One site, one tool: PDF → DOCX, converted inside the browser tab.

Screen: drop zone → conversion runs locally → side-by-side preview
(original page render | converted page render) → download `.docx`.
No sign-up for the free tier. Installable PWA that works offline.

| Tier | Limits | Price |
|---|---|---|
| Free | ≤ 5 pages per file, 3 files per day, no OCR | $0 |
| Pro | unlimited pages, batch, OCR for scans, offline PWA | $5/mo or $29/yr |
| SDK | the engine as an npm package under a commercial license | from $99/mo |

Free is limited by *pages*, not by a watermark: the user sees full quality on
their own file and pays when they bring the 40-page contract.

## Why it wins

Against client-side converters (GotConvert et al.): they wrap pdf.js text
extraction and emit unformatted text. We rebuild layout.

Against server converters (iLovePDF, Smallpdf, Adobe): their engine is a
licensed black box (Solid Documents / Adobe SDK) they cannot iterate. Ours
improves every week through the benchmark loop. Plus: zero upload time on
slow mobile networks (22% of iLovePDF traffic is India), no file-size cap,
and the file never leaves the device (lawyers, doctors, accountants).

Honest target for launch: ≥ parity with iLovePDF/Smallpdf on 80% of common
document classes (invoices, resumes, contracts, articles), faster on all.
Adobe parity on complex layouts is a months-long goal, not a launch goal.

## Architecture

```
PDF (ArrayBuffer)
  │  pdf.js (Apache-2.0) — glyphs with transforms, font names, images, vector rects
  ▼
extract/  → PageModel { runs[], images[], rects[] }        (engine)
  ▼
layout/   → lines → paragraphs → blocks (columns, tables, headings, lists)
  ▼
docx/     → `docx` npm (MIT) → Blob
  ▼
web/      → preview (pdf.js render | docx→html preview), download, PWA, paywall
bench/    → corpus + scorer; runs the engine and baselines, emits report
```

Everything is TypeScript. No Rust/WASM of our own until profiling on real
files shows the layout pass is compute-bound (it is not expected to be; PDF
parsing, the heavy part, is already native-speed inside pdf.js).

### Engine API (public contract, keep in sync)

```ts
// @unprint/engine
export interface ConvertOptions {
  pages?: number[];            // 1-based; default all
  ocr?: boolean;               // Pro; requires tesseract worker to be provided
  onProgress?: (done: number, total: number) => void;
}
export interface ConvertResult {
  docx: Uint8Array;
  pages: number;
  warnings: string[];          // e.g. "page 3: rotated text dropped"
}
export function convert(pdf: ArrayBuffer, opts?: ConvertOptions): Promise<ConvertResult>;

// Intermediate model, exposed for the benchmark and for debugging
export interface Run { text: string; x: number; y: number; w: number; h: number;
                       font: string; size: number; bold: boolean; italic: boolean; color: string;
                       generic?: "serif" | "sans" | "mono"; }
export interface Img { data: Uint8Array; mime: string; x: number; y: number; w: number; h: number; }
export interface Rect { x: number; y: number; w: number; h: number; stroke: boolean; fill: boolean; color: string; }
export interface PageModel { width: number; height: number; runs: Run[]; images: Img[]; rects: Rect[]; }
export function extract(pdf: ArrayBuffer): Promise<PageModel[]>;
```

Coordinates: PDF points, origin top-left, y grows downward (normalized from
PDF's bottom-left origin at extraction time).

`Rect.color` is the fill colour in force when the path was painted, blended
toward white by the fill alpha (`ca`) (`#rrggbb`); stroke colour is not
tracked. Rect and image boxes are cut to the rectangular clip in force.

`Run.generic` is the class from the PDF font descriptor flags (fixed pitch →
mono, serif flag → serif, else sans), the fallback when `font` is not a family
a reader knows.

`Img.mime` is always `image/png` for now: pdf.js hands the engine decoded
pixels, which it re-encodes. Passing original JPEG bytes through is a later
optimization.

### Benchmark

`bench/corpus/manifest.json` lists every PDF: `{ id, url, class, pages, license }`.
Classes: `article` (arXiv, multi-column), `invoice`, `resume`, `contract`,
`form`, `slides`, `scan` (image-only), `book` (single column prose),
`magazine` (NASA newsletters and magazines: 2–3 columns, sidebars,
two-page spreads; added after step 04, a small class that grows).
`url` is either an `https://…` source or `gen:<kind>:<arg>` for documents we
generate ourselves: `gen:invoice:<seed>`, `gen:resume:<seed>`,
`gen:book:<gutenberg id>`, `gen:html:<url>` (an HTML source paginated by
LibreOffice), `gen:scan:<source id>` (another manifest entry rasterized to an
image-only PDF). `pages` is the number of pages *kept*: `npm run corpus:fetch`
truncates longer files to the first `pages` pages (≤ 12), which bounds run
time. Current corpus: 133 documents — article 20, book 15, contract 15,
form 15, invoice 18, magazine 7, resume 18, scan 10, slides 15.
PDFs are downloaded by `npm run corpus:fetch`, never committed.

Scorer (`bench/score.ts`) per document:

1. `text` (0–1): mean of unigram F1 and bigram F1 over lowercase `\p{L}\p{N}`
   tokens. Original text comes from pdf.js `getTextContent` in item order, DOCX
   text from the `<w:t>` runs of `word/document.xml` with paragraphs joined by
   newlines. Bigrams make reading order count without an O(n·m) alignment.
   For a `scan` document the reference is the pdf.js text of the source PDF
   named in its `gen:scan:<source id>` url, since the image-only original has
   no text layer of its own.
2. `visual` (0–1): ink overlap between the original page raster and the DOCX
   rendered back to PDF (LibreOffice headless, dev-only) then raster
   (pdftoppm), both at 72 dpi grayscale. Each page becomes an ink map on a
   grid of 16 px cells (≈ two text lines at 72 dpi) taken from the original,
   the cell value being mean darkness (255 − gray)/255 in [0,1]; each map is
   blurred by a 3×3 box so a one-cell shift still overlaps; `visual` is the
   weighted Jaccard Σ min(A,B) / Σ max(A,B) over the cells, and 1 when both
   pages are blank. The converted rendering is padded with white or cropped
   to the original page size. Pixel SSIM was tried first and rejected: it
   punished a few-pixel baseline shift or a substituted font almost like a
   blank page. Converted pages beyond the original's count are ignored,
   missing ones score 0; the per-document `visual` is the mean over original
   pages.
3. `score = 100 * (0.6 * text + 0.4 * visual)`.

A document whose conversion or scoring throws gets `text` = `visual` = 0 and an
`error` string. Class means include those zeros; the error count is printed
next to the mean.

Results land in `bench/results/<engine>.json` —
`{ engine, date, docs: [{ id, class, pages, text, visual, score, ms, error? }] }`.
CLI flags: `--only <id>`, `--limit <n>`, `--no-cache`.

Report: `bench/report/index.html` — table by class (n per engine), per-doc
rows, and the worst 3 documents of every class per engine with side-by-side
thumbnails (first page at 40 dpi). Every row links to the original PDF and to
each engine's DOCX and rendered PDF. Baselines run through the same scorer:
`pdf2docx` (local, AGPL, eval-only), and manual uploads to iLovePDF / Smallpdf
/ Adobe for the public comparison (done once per release by hand, dropped as
`bench/competitors/<name>/<id>.docx` and scored with
`--engine competitor:<name>`).

### Web

Vite + vanilla TypeScript, no framework. `vite-plugin-pwa` for offline.
Hosted on Cloudflare Pages (free). Pro license keys validated against the
merchant-of-record API (Lemon Squeezy by default; see DECISIONS) and cached in
`localStorage`; the free-tier counter also lives in `localStorage` — it is a
soft limit by design, not DRM.

### Privacy claim

The claim "your file never leaves your device" must stay verifiable: the web
app makes no network request carrying file bytes, ever. CSP in `index.html`
must list `connect-src` explicitly (license API + analytics host only).
