# Step 05 — Tables, ruled and unruled

**Repo:** `unprint-engine`. **Session:** 1.

## Goal
Tables become Word tables: ruled tables from vector lines, unruled tables
from text alignment (invoices, financial statements), merged cells,
header row, cell alignment. Rows of a table never collapse into paragraphs
and paragraphs never turn into a table (the GotConvert failure mode).

## Deliverables
- `src/layout/tables/ruled.ts`: grid from `Rect`s (horizontal/vertical
  lines → cell lattice; merged cells from missing inner lines).
- `src/layout/tables/unruled.ts`: candidate = ≥ 3 consecutive lines whose
  runs share ≥ 2 x-aligned column starts (tolerance 2 pt), with row gaps
  regular; columns from the union of aligned x positions.
- `src/layout/tables/cells.ts`: run assignment to cells, cell text
  paragraphs (reuse step 03), alignment per cell (numeric → right).
- Writer: `docx` `Table` with borders only when the source was ruled.

## Automatic done-criteria
- Unit tests: ruled 3×3, ruled with a merged header, unruled invoice
  lines, false-positive guard (two-line address block is not a table),
  table inside a column.
- Bench on classes `invoice`, `form`: unprint ≥ pdf2docx; no regression
  > 1 point elsewhere.

## Human validation
1. Convert two invoices and one bank statement. In Word: are numbers in
   cells, right-aligned, can you sum a column by selecting it?
2. Convert a resume with a two-column skills block: did it stay a layout,
   not become a table with borders?
