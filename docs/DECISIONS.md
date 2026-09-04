# Decisions (locked; change only with the human's explicit OK)

| # | Decision | Why |
|---|---|---|
| 1 | Name: **unprint**. Domain unprint.com. | PDF is "printed"; we un-print it. Domain free at whois check 2026-09-04; GitHub name free. |
| 2 | Two repos: `unprint` (public, MIT) and `unprint-engine` (private). | The engine + corpus loop is the moat and the SDK product. A source-available license (PolyForm Noncommercial / BSL) stops *copying* but not *reading and re-implementing*; while the engine is small, reading is enough to clone it. Flip `unprint-engine` to source-available (PolyForm Noncommercial 1.0.0) once there are paying SDK customers and a public benchmark lead. |
| 3 | TypeScript only, no own Rust/WASM. | The heavy part (PDF parsing) is native-speed inside pdf.js already; layout heuristics are not compute-bound. Revisit only with a profile. |
| 4 | pdf.js for extraction, not PDFium. | Apache-2.0, mature, gives glyph transforms + font names + operator list for images. Fallback: `@hyzyla/pdfium` if image/vector extraction proves insufficient. |
| 5 | `docx` npm for output. | MIT, maintained, covers paragraphs/tables/images/sections/columns. |
| 6 | pdf2docx / MuPDF are eval-only baselines. | AGPL. Never copied, never shipped. Read as reference for heuristics, re-implement. |
| 7 | Benchmark score is the acceptance criterion for every engine step. | Competitors cannot iterate their licensed engines; we can. The loop is the product. |
| 8 | Vite + vanilla TS, Cloudflare Pages. | Static site, no server, $0 hosting, PWA-friendly. |
| 9 | Merchant of record: Lemon Squeezy (Paddle as alternative). | Solo founder, global VAT handled, client-side license check API. Stripe direct needs own tax handling. Final choice made in step 08 after checking availability for the founder's country. |
| 10 | Free tier limited by pages/day count, not watermark. | User sees full quality on their own file; conversion happens at the 40-page contract. |
| 11 | Corpus only from openly licensed sources (arXiv, .gov, own generated). | The corpus manifest is public; third-party contracts cannot be. |
| 12 | Promotion: SDK cold outreach (week 1), Reddit + Substack + Product Hunt (launch), long-tail SEO (months 4+). No Hacker News, no Habr. | Founder's standing constraints. |
