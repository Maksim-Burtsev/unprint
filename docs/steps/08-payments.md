# Step 08 — Payments and Pro

**Repo:** `unprint` (public). **Session:** 1.

## Goal
Money can arrive. Pro is purchasable in two clicks, unlocked by license key,
works offline after activation.

## Deliverables
- Merchant of record account (Lemon Squeezy; Paddle if LS unavailable for
  the founder's country) — human task via wizard.
- Products: Pro monthly $5, Pro yearly $29. Checkout overlay on the site.
- `web/src/license.ts`: activate key → LS license API → store
  `{ key, instanceId, validUntil }` in `localStorage`; re-validate at most
  once per 7 days when online; offline grace = `validUntil`.
- Pro gates: page limit off, batch ZIP, OCR toggle (feature flag until
  step 09).
- Account-less by design: license key is the account. "Lost your key?" →
  LS customer portal link.
- Receipts/refunds handled by the merchant of record.

## Automatic done-criteria
- Playwright: fake license API (route intercept) → activate → limits
  lifted → reload offline → still Pro.
- A real test purchase in LS test mode end to end, evidence: screenshot of
  the order and the activated state.

## Human validation
1. Buy Pro with your own card in live mode, then refund yourself from the
   LS dashboard. Both worked?
2. Activate on phone and laptop with the same key: allowed (instance limit
   should be ≥ 3)?
