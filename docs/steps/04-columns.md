# Step 04 — Columns and reading order

**Repo:** `unprint-engine`. **Session:** 1.

## Goal
Multi-column pages (2, 3, mixed with full-width headers/figures) come out
as Word sections with the right column count and text flowing in the right
order. This is where every client-side competitor breaks.

## Deliverables
- `src/layout/columns.ts`: XY-cut / whitespace-gutter detection on the
  paragraph boxes; supports N columns, full-width blocks spanning columns
  (title, abstract, figure), column boundaries changing mid-page (Word
  section breaks, continuous).
- `src/layout/order.ts`: reading order = top-to-bottom within a column,
  columns left-to-right, spanning blocks in y-order.
- Writer: `docx` sections with `column` settings; continuous section breaks.

## Automatic done-criteria
- Unit tests: 2-col, 3-col, 2-col with spanning title, 1-col→2-col switch
  mid-page, false positive guard (justified prose with a wide gap column
  must stay 1-col).
- Bench on class `article`: unprint ≥ pdf2docx, and no regression > 1 point
  on any other class.

## Human validation
1. Convert two arXiv papers and one magazine-style PDF. In Word, does the
   text read in the right order when you Select All and paste into a plain
   text editor?
2. Is the title full-width above the columns, not stuffed into column 1?
