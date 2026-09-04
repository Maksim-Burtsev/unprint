# Step 09 — OCR for scanned PDFs (Pro)

**Repo:** `unprint-engine` + `unprint`. **Session:** 1.

## Goal
Image-only PDFs (class `scan`) produce editable text with layout, in the
browser, Pro only.

## Deliverables
- `src/ocr/`: tesseract.js worker (Apache-2.0), language packs loaded
  lazily (eng default; +spa, por, hin, ind, rus, deu, fra), results mapped
  to `Run`s so the whole layout pipeline reuses steps 03–06 unchanged.
- Scan detection: page with images covering ≥ 90% of area and < 10 runs.
- Web: OCR toggle, language picker, progress per page; clear warning on
  time ("~3 s per page on this device").

## Automatic done-criteria
- Bench on class `scan`: unprint text F1 ≥ 0.85 on eng documents.
- No regression on other classes (OCR must not trigger on text PDFs).

## Human validation
1. Scan a page with your phone, convert: is the text right, paragraphs
   preserved?
2. A mixed PDF (text pages + one scanned page): only the scanned page ran
   OCR (check timing)?
