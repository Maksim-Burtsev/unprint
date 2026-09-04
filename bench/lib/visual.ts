import { readFileSync, readdirSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { run, soffice } from "./sh.js";

export type Gray = { w: number; h: number; px: Uint8Array };

export function readPgm(path: string): Gray {
  const buf = readFileSync(path);
  // header: P5 <ws> width <ws> height <ws> maxval <single ws>; comments (#…) allowed
  let i = 0; const fields: string[] = [];
  while (fields.length < 4) {
    while (buf[i] === 0x23) { while (buf[i] !== 0x0a) i++; i++; } // skip comment line
    let s = ""; while (i < buf.length && !/\s/.test(String.fromCharCode(buf[i]!))) s += String.fromCharCode(buf[i++]!);
    fields.push(s); i++;
  }
  if (fields[0] !== "P5" || fields[3] !== "255") throw new Error(`unsupported PGM ${path}: ${fields.join(" ")}`);
  const w = +fields[1]!, h = +fields[2]!;
  return { w, h, px: new Uint8Array(buf.buffer, buf.byteOffset + i, w * h) };
}

export function rasterize(pdf: string, outDir: string, dpi = 72): Gray[] {
  mkdirSync(outDir, { recursive: true });
  const pages = () => readdirSync(outDir).filter((f) => /^p-\d+\.pgm$/.test(f)).sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)));
  if (pages().length === 0) run("pdftoppm", ["-r", String(dpi), "-gray", pdf, join(outDir, "p")]);
  return pages().map((f) => readPgm(join(outDir, f)));
}

export function docxToPdf(docx: string, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), "lo-profile-"));
  try {
    run(soffice(), [`-env:UserInstallation=file://${profile}`, "--headless", "--convert-to", "pdf", "--outdir", outDir, docx]);
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
  const out = join(outDir, basename(docx).replace(/\.docx$/i, ".pdf"));
  if (!existsSync(out)) throw new Error(`soffice produced no PDF for ${docx}`);
  return out;
}

const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2, WIN = 8;

/** Mean SSIM over 8×8 windows on a's grid; b is cropped/padded with white to a's size.
 *  ponytail: windows blank in BOTH images are skipped so a blank page does not score ~0.7 against text.
 *  Upgrade path: gaussian 11×11 windows if 8×8 blocks prove too coarse. */
export function ssim(a: Gray, b: Gray): number {
  const at = (g: Gray, x: number, y: number) => (x < g.w && y < g.h ? g.px[y * g.w + x]! : 255);
  let sum = 0, n = 0;
  for (let y0 = 0; y0 < a.h; y0 += WIN) for (let x0 = 0; x0 < a.w; x0 += WIN) {
    let ma = 0, mb = 0, cnt = 0;
    for (let y = y0; y < Math.min(y0 + WIN, a.h); y++) for (let x = x0; x < Math.min(x0 + WIN, a.w); x++) { ma += at(a, x, y); mb += at(b, x, y); cnt++; }
    ma /= cnt; mb /= cnt;
    let va = 0, vb = 0, cov = 0;
    for (let y = y0; y < Math.min(y0 + WIN, a.h); y++) for (let x = x0; x < Math.min(x0 + WIN, a.w); x++) {
      const da = at(a, x, y) - ma, db = at(b, x, y) - mb; va += da * da; vb += db * db; cov += da * db;
    }
    va /= cnt; vb /= cnt; cov /= cnt;
    if (va < 1 && vb < 1) continue;
    sum += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2)); n++;
  }
  return n === 0 ? 1 : sum / n;
}

export function visualScore(orig: Gray[], conv: Gray[]): number {
  if (orig.length === 0) return 1;
  return orig.reduce((s, p, i) => s + (conv[i] ? ssim(p, conv[i]!) : 0), 0) / orig.length;
}
