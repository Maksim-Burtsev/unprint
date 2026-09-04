# Step 01 — Corpus and scorer (the benchmark harness)

**Repo:** `unprint` (public). **Session:** 1.

## Goal
A reproducible number. Before any engine code exists, we can run any
PDF→DOCX converter through the same scorer and get a score per document
class. This is the acceptance test for every later step.

## Deliverables
- `bench/corpus/manifest.json`: ≥ 120 PDFs across the 8 classes in
  SPEC § Benchmark (≥ 10 per class; `scan` class made by rasterizing 10
  `book`/`contract` docs to image-only PDFs). Sources: arXiv (CC-BY),
  data.gov, sec.gov EDGAR exhibits, own generated invoices/resumes via
  LibreOffice templates. Each entry has `license`.
- `bench/corpus/fetch.ts`: downloads to `bench/corpus/files/` (gitignored).
- `bench/score.ts`: implements the scorer from SPEC (text F1 + SSIM), CLI:
  `npm run bench -- --engine <name>` where `<name>` is a converter adapter
  in `bench/engines/`.
- `bench/engines/pdf2docx.ts`: baseline adapter that shells out to
  `uvx pdf2docx` (dev-only, AGPL, documented as such).
- `bench/engines/passthrough.ts`: "convert" = plain text dump; the floor.
- `bench/report/`: static HTML report generator: table by class, per-doc
  rows, worst-10 with original/converted thumbnails side by side.
- Dev prerequisites documented in `bench/README.md`: `brew install
  poppler libreoffice`, `uv`.

## Automatic done-criteria
- `npm run bench -- --engine passthrough` and `--engine pdf2docx` both
  finish on the full corpus without crashing; scores saved to
  `bench/results/<engine>.json`.
- Scorer self-check: `score(doc, doc-rendered-back-unchanged) ≥ 95`
  and `score(doc, empty.docx) ≤ 10`. This is the one test that must exist.
- Report opens locally and shows both engines.

## Human validation
1. Open `bench/report/index.html`. Does the class breakdown look sane
   (pdf2docx well above passthrough everywhere except `scan`)?
2. Open 5 random worst-10 pairs for pdf2docx. Do the thumbnails show a real
   layout failure, or is the scorer wrong? If the scorer is wrong, say
   which pair.
3. Spot-check 5 manifest entries: license is real and permissive.
