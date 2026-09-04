# Step 06 — Images, fonts, colors, page geometry

**Repo:** `unprint-engine`. **Session:** 1.

## Goal
Visual fidelity: images placed where they were (inline vs. floating with
text wrap), captions attached, fonts mapped to the nearest installed family,
text colors and highlights preserved, page size/margins/orientation right,
headers/footers detected and put in Word header/footer.

## Deliverables
- `src/layout/images.ts`: image blocks; inline if full-width or on its own
  line, else floating anchored to the nearest paragraph with square wrap.
- `src/layout/headers.ts`: repeated text at the same y across ≥ 60% of
  pages → header/footer; page numbers detected and replaced by a field.
- `src/docx/fonts.ts`: map extracted family names to a table of 40 common
  families (Times, Helvetica/Arial, Calibri, Cambria, Georgia, Courier,
  Garamond, ...) with serif/sans/mono fallback by PDF font descriptor flags.
- Colors: run color → docx run color; filled `Rect` behind text →
  highlight/shading.

## Automatic done-criteria
- Unit tests for header/footer detection and image placement.
- Bench: `visual` component improves by ≥ 5 points on average vs step 05;
  overall unprint ≥ pdf2docx on every class except `scan`.

## Human validation
1. Convert a brochure-like PDF with photos and a paper with figures:
   images present, right place, captions under them?
2. Page numbers in the Word footer, not floating in the body?
3. Does the font look like the original at a glance?
