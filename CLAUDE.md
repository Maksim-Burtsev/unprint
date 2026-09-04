# unprint — agent protocol

You are executing one step of a multi-session plan. The human runs one step
per session and validates the result by hand between sessions.

## Before touching code

1. Read `docs/CONTEXT.md` (why the project exists, expectations, roles),
   `docs/SPEC.md` (product + architecture), `docs/DECISIONS.md` (locked
   choices; do not re-litigate), `docs/GO-TO-MARKET.md` if the step touches
   pages or outreach, and the step file the user named in `docs/steps/NN-*.md`.
2. Check `docs/roadmap.html` `STATUS` object: the previous step must be
   `done`. If it is not, stop and tell the user.
3. Invoke `superpowers:writing-plans` for this step only, then execute with
   `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
   Step files give goal, deliverables, automatic done-criteria and the
   human validation list; they are specs, not task lists.

## Session start ritual

If the user says "Implement step NN": first check the previous step's
`STATUS`; if it is `awaiting_validation`, ask the user whether validation
passed, set it to `done`, and only then start. If the user says "continue
step NN", the step was not finished last time: read its `evidence`, resume.

## Rules

- Language of everything in this repo is English.
- Ponytail applies: stdlib and existing deps first, TypeScript only, no new
  dependency for what ten lines can do. Every non-trivial piece of logic
  leaves one runnable check behind.
- Never ship AGPL code. `pdf2docx` and MuPDF are eval-only baselines run
  from `bench/` dev scripts; their code is never copied into the engine.
- The engine lives in `../unprint-engine` (separate repo, private). Keep the
  public API in `docs/SPEC.md` § Engine API in sync when it changes.
- Benchmark is the source of truth. A step that touches the engine ends by
  running `npm run bench` and pasting the score table into the step report.
  Score must not regress on any corpus class without an explicit note.
- Commit per task, `git add <paths>`, never `git add -A`. Do not commit the
  corpus PDFs themselves; commit `bench/corpus/manifest.json` only.

## Finishing a step

1. All automatic done-criteria in the step file pass; paste the evidence.
2. Update `docs/roadmap.html`: set this step's entry in `STATUS` to
   `"awaiting_validation"` (the human flips it to `"done"` in the next
   session after validating) and fill `evidence` with the score table or
   URL. Then republish it with the Artifact tool passing
   `url: https://claude.ai/code/artifact/7bcdc6dd-8206-42cc-a8ed-37b01d2a2495`
   so the founder's dashboard updates in place.
3. Reply to the user in their language with: what was built, the numbers,
   and the exact human-validation checklist from the step file, so they can
   sign off before the next session.
