# Step 02 — Extraction layer (engine repo is born)

**Repo:** `unprint-engine` (create, private). **Session:** 1.

## Goal
`extract(pdf) → PageModel[]` per SPEC § Engine API: every glyph run with
position, size, font flags and color; every image with bytes and box; every
vector rectangle/line. Nothing about layout yet.

## Deliverables
- `../unprint-engine/` initialized: `package.json` (`@unprint/engine`,
  `"private": true`, `"license": "UNLICENSED"`), TypeScript, vitest, pdf.js.
- `src/extract/index.ts`: runs pdf.js `getTextContent` + `getOperatorList`
  per page; merges adjacent glyphs of the same font/size/baseline into
  `Run`s; normalizes coordinates to top-left origin; decodes images
  (`OPS.paintImageXObject`) to PNG/JPEG bytes; collects `re`/`l` paths as
  `Rect`s.
- `src/extract/fonts.ts`: bold/italic detection from font name and
  descriptor flags; font family normalization ("ABCDEF+TimesNewRoman-Bold"
  → "Times New Roman", bold).
- `bench/engines/unprint.ts` adapter in the public repo importing the engine
  via `npm link` (documented in `bench/README.md`).
- Golden tests: 6 small PDFs in `unprint-engine/test/fixtures/` (generated
  by LibreOffice from known DOCX: one-paragraph, bold/italic mix, 2 images,
  ruled table, 2-column, rotated text) with expected `PageModel` JSON.

## Automatic done-criteria
- Golden tests pass.
- `extract` runs over the full corpus without throwing; per-page time
  logged; median page < 50 ms on the dev machine.
- Text F1 of `extract` runs (joined in y/x order) vs pdf.js raw text on the
  corpus ≥ 0.98 — proves runs are not lost while merging.

## Human validation
1. Run `npm run dump -- <any pdf>` in the engine repo and look at the JSON
   for one article page: do run boxes, fonts and bold flags match what you
   see in the PDF viewer?
2. Confirm the two repos exist, the engine one is private on GitHub.
