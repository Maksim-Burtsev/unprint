# unprint

PDF → Word that never leaves your device.

unprint converts PDF to editable DOCX entirely in the browser: no upload, no
server, no file-size limit, works offline. The layout-reconstruction engine
rebuilds paragraphs, headings, lists, multi-column flow, tables (ruled and
unruled), images and fonts from raw PDF glyph coordinates.

Public benchmark: every release is scored against the same open corpus as
iLovePDF, Smallpdf and Adobe. See `bench/`.

## Repos

| Repo | License | Contents |
|---|---|---|
| `unprint` (this) | MIT | web app, PWA, benchmark harness, corpus manifest, docs |
| `unprint-engine` | private (source-available later) | the reconstruction engine, sold as an SDK |

## Status

See `docs/roadmap.html` (or the published artifact) for the step-by-step plan
and what is done.

## Development

Each step in `docs/steps/` is one working session for a coding agent.
Read `CLAUDE.md` first.
