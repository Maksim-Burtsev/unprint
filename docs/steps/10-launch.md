# Step 10 — Benchmark page, SEO pages, SDK package, outreach list

**Repo:** `unprint` (public) + `unprint-engine`. **Session:** 1–2.

## Goal
Everything the go-to-market needs exists. The public benchmark is the
centerpiece of all three channels.

## Deliverables
- Competitor runs: human uploads the same 30-doc public subset to iLovePDF,
  Smallpdf, Adobe (free tiers), saves DOCX to
  `bench/report/competitors/<vendor>/`; agent scores them.
- `web/benchmark/`: public page with methodology, per-class table, worst/
  best examples with side-by-side images, download of the corpus manifest
  and scorer. Updated by `npm run bench:publish`.
- SEO pages from one template + one JSON (GO-TO-MARKET § 3): intent,
  vertical, class, ×4 languages. Each page embeds the converter, not just
  text. Sitemap, canonical, hreflang.
- SDK: `@unprint/engine` built as ESM + d.ts, `LICENSE` = commercial
  license text (PolyForm Noncommercial as the public terms, commercial
  grant sold separately), published to npm as a restricted package or to
  GitHub Packages; `docs/sdk.md` with a 10-line integration example and
  pricing.
- Outreach list: `docs/prospects.csv` with 100 PDF tool sites/apps: domain,
  contact, current engine guess, monthly visits estimate, personal note.
  Plus a per-prospect email draft template with the benchmark on one of
  their sample files.
- Launch drafts: Reddit posts (5 subs), Product Hunt listing, Substack
  article "300 PDFs vs iLovePDF, Smallpdf, Adobe and a browser tab".

## Automatic done-criteria
- Benchmark page live, all links resolve, Lighthouse SEO = 100.
- `npx @unprint/engine` demo integration works from a fresh directory with
  a license key.
- Sitemap submitted in Search Console (human), indexation request sent.

## Human validation
1. Read the benchmark page as a skeptical buyer: is the methodology
   convincing, are the worst examples shown honestly?
2. Pick 10 prospects from the CSV and send the emails (this is your job
   from here on).
3. Post the Reddit / PH / Substack drafts.
