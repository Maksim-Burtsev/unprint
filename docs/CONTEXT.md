# Context — why this project exists

Read this once if you are a new agent. It is the reasoning behind SPEC and
DECISIONS, so you can make judgment calls the way the founder would.

## Origin (2026-09-04)

The founder wanted a product that (a) can be built by coding agents over a
few sessions, (b) copies a proven revenue mechanic, (c) costs ≤ $100 to
launch, (d) gets traffic from Google, and (e) earns real money as early as
possible. Research across verified-revenue databases (TrustMRR, Stripe data)
and traffic tools produced a top-5; this one won because it is the only
candidate where hard engineering becomes a moat instead of a two-day clone.

Key facts that shaped the decisions:

- **Organic Google on a new domain takes 4–6 months** to produce
  meaningful traffic (Ahrefs/Semrush 2026 data). So week-1 money must come
  from direct SDK sales, not search. Search is the biggest channel later.
- **"pdf to word" is 7.3M searches/month**, "jpg to pdf" 5.1M. iLovePDF
  gets ~225M visits/month, 71% organic, top markets India (22%), Indonesia,
  Brazil — slow mobile networks where upload time dominates. Head terms are
  owned by 10-year-old domains; only long-tail pages are reachable early.
- **Nobody does PDF→Word with layout client-side.** GotConvert (the only
  client-side one) drops images, emits monochrome text, collapses columns
  into tables. LibreOffice compiled to WASM exists (ZetaOffice) but is
  hundreds of MB and unstable; nobody ships it for conversion. Server
  players (iLovePDF, Smallpdf, Adobe) license a black-box engine (Solid
  Documents / Adobe SDK) they cannot improve themselves.
- **Best open reference is pdf2docx** (Python, PyMuPDF, AGPL): rule-based
  layout, max 2 columns, no floating images, text PDFs only. We read it as
  a reference for heuristics and re-implement; we never copy (AGPL) and
  never ship it. It is our baseline in the benchmark.
- **Clones lose to distribution.** In the August 2026 pay-to-rank clone
  wave the original took 77% of all revenue; 258 of 322 clones made < $100.
  Our defense is not the code but the *benchmark loop*: corpus + scorer +
  agents iterating daily, which licensed-engine competitors cannot match.

## What the product is, in one paragraph

A single-purpose site: PDF → DOCX converted inside the browser tab, no
upload, no size limit, works offline. Free up to 5 pages/file; Pro $5/mo
or $29/yr; the engine sold as an SDK to other PDF tool sites from $99/mo.
Positioning: privacy ("your file never leaves your device") + speed on
slow networks + a public benchmark that shows fidelity vs iLovePDF,
Smallpdf and Adobe on the same corpus.

## Honest expectations

- Launch target: parity with iLovePDF/Smallpdf on ~80% of common document
  classes (invoices, resumes, contracts, articles), faster on all. Adobe
  parity on complex layouts is months away.
- First revenue: SDK customers within weeks of step 10 (founder sends the
  emails). Pro subscriptions follow launch spikes. Organic search from
  month 4–6.
- Budget: domain (~$12), Cloudflare Pages ($0), Lemon Squeezy (% of sales),
  optional Plausible ($9). Everything else is agent time.

## Roles

- **Founder**: registers domain and accounts (via wizards the agent
  writes), validates each step by hand using the checklist, sends outreach
  emails, posts on Reddit / Product Hunt / Substack. No Hacker News, no
  Habr. Communicates in Russian; the repo is English.
- **Agents**: everything else. One step per session, see `CLAUDE.md`.

## Working style the founder expects

Lazy-senior: stdlib and existing deps before new code, no speculative
abstractions, shortest diff that passes the benchmark, one runnable check
per non-trivial piece of logic. Numbers over adjectives: every engine step
ends with the score table. Say plainly when a target is not met.
