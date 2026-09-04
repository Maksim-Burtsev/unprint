# Plan — one step per session

Say to the agent: "Implement step NN". The agent reads `CLAUDE.md`, the spec
and the step file, plans that step, builds it, runs the benchmark, updates
`docs/roadmap.html`, and ends with your validation checklist.

| Step | Repo | What exists after it | Money |
|---|---|---|---|
| 01 | unprint | corpus + scorer + baselines report | — |
| 02 | unprint-engine | `extract()`: glyphs, images, rects | — |
| 03 | unprint-engine | first DOCX: paragraphs, headings, lists | — |
| 04 | unprint-engine | columns, reading order | — |
| 05 | unprint-engine | tables ruled + unruled | — |
| 06 | unprint-engine | images, fonts, colors, headers/footers | — |
| 07 | unprint | site live, PWA, free tier | — |
| 08 | unprint | Pro purchasable | first $ possible |
| 09 | both | OCR for scans (Pro) | — |
| 10 | both | benchmark page, SEO pages, SDK, prospects | SDK outreach starts |

Steps 03–06 are the engine loop; if a step's bench target is not met in one
session, the next session repeats the same step (say "continue step NN").
Do not move to 07 before 06 beats pdf2docx on every non-scan class.

Step 0 (done 2026-09-04): this repo, docs, roadmap.
