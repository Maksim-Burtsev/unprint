# Step 07 — Web app, PWA, deploy (free tier live)

**Repo:** `unprint` (public). **Session:** 1.

## Goal
unprint.com is live: drop a PDF, get a DOCX, nothing uploaded. Installable,
works offline. Free-tier limits enforced. Privacy claim verifiable in
DevTools.

## Deliverables
- `web/` Vite + vanilla TS app: drop zone, file list, per-file progress
  (engine `onProgress`), side-by-side preview (pdf.js canvas | DOCX preview
  via rendering the produced pages with `docx-preview` or by re-rendering
  our own PageModel — pick the cheaper that looks right), Download button,
  batch ZIP (Pro only, greyed in Free).
- Engine runs in a Web Worker; UI never blocks.
- Free tier: ≤ 5 pages/file, 3 files/day, counter in `localStorage`, clear
  copy explaining the limit and the Pro price.
- PWA: `vite-plugin-pwa`, offline shell, "Install" prompt.
- `index.html` CSP with explicit `connect-src` (license API + analytics
  host only). Plausible or Cloudflare Web Analytics, no cookies.
- Landing copy: headline = privacy claim; second block = benchmark teaser
  (link to step 10 page, placeholder until then); FAQ with the
  "how do I know it doesn't upload" answer (open DevTools → Network).
- Deploy: Cloudflare Pages via GitHub Actions on push to `main`.
  Wizard (`mattpocock-skills:wizard`) for the human: domain DNS, Cloudflare
  project.

## Automatic done-criteria
- Playwright test: drop fixture PDF → DOCX downloaded, no request with a
  body > 1 KB made during conversion (assert on network log).
- Lighthouse PWA installable, performance ≥ 90 on mobile.
- Deployed URL returns 200.

## Human validation
1. On your phone, open the site, convert a 30-page PDF from your files:
   does it finish, and does the free limit kick in correctly?
2. Turn on airplane mode, reopen the installed app: still works?
3. DevTools → Network during conversion: nothing uploaded.
