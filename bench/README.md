# bench — the benchmark harness

Prerequisites (macOS): `brew install poppler uv && brew install --cask libreoffice`. Node ≥ 22.
The scorer needs `pdftoppm`, `pdfseparate`, `pdfunite`, `soffice`, `unzip`, `zip`; the corpus step also needs `uvx img2pdf`; the pdf2docx baseline needs `uvx pdf2docx`.

    npm install
    npm run corpus:fetch                 # downloads + generates bench/corpus/files/ (gitignored)
    npm run bench -- --engine passthrough
    npm run bench -- --engine pdf2docx   # AGPL baseline, eval-only, runs via uvx; never vendored
    open bench/report/index.html

Flags: `--only <id>` scores one doc, `--limit <n>` the first n docs, `--no-cache` re-converts.
Results: `bench/results/<engine>.json` (gitignored). Report: `bench/report/index.html`.
Scorer: text = mean(unigram F1, bigram F1) of pdf.js text vs DOCX text; visual = mean SSIM
(8×8 windows, windows blank in both images skipped) of 72 dpi grayscale pages, DOCX rendered
back to PDF by LibreOffice; score = 100·(0.6·text + 0.4·visual). See docs/SPEC.md.
