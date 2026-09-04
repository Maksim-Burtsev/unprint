# unprint — agent protocol

You are executing one step of a multi-session plan. The human runs one step
per session and validates the result by hand between sessions.

## Before touching code

1. Read `docs/SPEC.md` (product + architecture), `docs/DECISIONS.md`
   (locked choices; do not re-litigate), and the step file the user named in
   `docs/steps/NN-*.md`.
2. Check `docs/roadmap.html` `STATUS` object: the previous step must be
   `done`. If it is not, stop and tell the user.
3. Invoke `superpowers:writing-plans` for this step only, then execute with
   `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
   Step files give goal, deliverables, automatic done-criteria and the
   human validation list; they are specs, not task lists.

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
2. Update `docs/roadmap.html`: set this step's entry in `STATUS` to `"done"`
   and fill `evidence` with the score table or URL. Republish the artifact if
   the user asks.
3. Reply to the user in their language with: what was built, the numbers,
   and the exact human-validation checklist from the step file, so they can
   sign off before the next session.
