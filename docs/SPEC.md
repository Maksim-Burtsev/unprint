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
                       font: string; size: number; bold: boolean; italic: boolean; color: string; }
export interface Img { data: Uint8Array; mime: string; x: number; y: number; w: number; h: number; }
export interface Rect { x: number; y: number; w: number; h: number; stroke: boolean; fill: boolean; }
export interface PageModel { width: number; height: number; runs: Run[]; images: Img[]; rects: Rect[]; }
export function extract(pdf: ArrayBuffer): Promise<PageModel[]>;
```

Coordinates: PDF points, origin top-left, y grows downward (normalized from
PDF's bottom-left origin at extraction time).

### Benchmark

`bench/corpus/manifest.json` lists every PDF: `{ id, url, class, pages, license }`.
Classes: `article` (arXiv, multi-column), `invoice`, `resume`, `contract`,
`form`, `slides`, `scan` (image-only), `book` (single column prose).
PDFs are downloaded by `npm run corpus:fetch`, never committed.

Scorer (`bench/score.ts`) per document:

1. `text` (0–1): token-level F1 between reading-order text of the original
   (pdf.js) and of the produced DOCX (unzipped `word/document.xml`).
2. `visual` (0–1): mean per-page SSIM between the original page raster and
   the DOCX rendered back to PDF (LibreOffice headless, dev-only) then raster
   (pdftoppm). Both at 72 dpi grayscale.
3. `score = 100 * (0.6 * text + 0.4 * visual)`.

Report: `bench/report/index.html` — table by class, per-doc rows, worst-10
with side-by-side thumbnails. Baselines run through the same scorer:
`pdf2docx` (local, AGPL, eval-only), and manual uploads to iLovePDF /
Smallpdf / Adobe for the public comparison (done once per release by hand,
stored under `bench/report/competitors/`).

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
