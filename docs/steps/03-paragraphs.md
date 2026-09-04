# Step 03 — Lines, paragraphs, headings, lists → first DOCX

**Repo:** `unprint-engine`. **Session:** 1.

## Goal
First end-to-end conversion. Single-column prose comes out as real
paragraphs with the right font size, bold/italic, alignment, indentation,
headings as heading styles and bullet/numbered lists as Word lists.

## Deliverables
- `src/layout/lines.ts`: runs → lines (baseline clustering, tolerance
  = 0.3 × font size), word spacing normalization.
- `src/layout/paragraphs.ts`: lines → paragraphs (gap > 1.5 × leading, or
  indent change, or font-size change); alignment detection (left / right /
  center / justified from line-edge variance); first-line indent.
- `src/layout/headings.ts`: heading levels by font-size clusters relative to
  body size (body = most common size by character count).
- `src/layout/lists.ts`: bullet glyphs (•, -, –, ▪, numbers with `.`/`)`)
  at line start with hanging indent → list items with level from indent.
- `src/docx/writer.ts`: paragraphs → `docx` npm document; page size and
  margins from `PageModel` and the bounding box of content.
- `convert(pdf, opts)` per SPEC, wired end to end.

## Automatic done-criteria
- Unit tests for each layout module on synthetic `PageModel`s (write the
  models by hand in the test; ≥ 3 cases each incl. the tricky one:
  justified text with wide word gaps must not split into columns).
- Bench on classes `book`, `contract`, `resume`: unprint score ≥ pdf2docx
  score on each of the three classes. Paste the table.

## Human validation
1. Convert three of your own single-column PDFs (a contract, an article
   without columns, a letter). Open in Word/Pages. Are paragraphs
   paragraphs (not one line per paragraph, not one giant paragraph)?
2. Are headings styled as headings (Navigation pane in Word shows them)?
3. Do lists behave as lists (pressing Enter continues the list)?
