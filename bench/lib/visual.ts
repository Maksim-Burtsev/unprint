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

const CELL = 16;

/** Mean darkness per cell of a's grid; pixels outside g are white, keeping the pad/crop semantics. */
function inkMap(g: Gray, w: number, h: number, cw: number, ch: number): Float64Array {
  const v = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sum = 0, n = 0;
    for (let y = cy * CELL; y < Math.min((cy + 1) * CELL, h); y++) for (let x = cx * CELL; x < Math.min((cx + 1) * CELL, w); x++) {
      sum += x < g.w && y < g.h ? 255 - g.px[y * g.w + x]! : 0; n++;
    }
    v[cy * cw + cx] = sum / (255 * n);
  }
  return v;
}

/** 3×3 box blur, edge cells averaging the neighbours they have, so a one-cell shift still overlaps. */
function blur(v: Float64Array, cw: number, ch: number): Float64Array {
  const out = new Float64Array(v.length);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    let sum = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy < 0 || yy >= ch || xx < 0 || xx >= cw) continue;
      sum += v[yy * cw + xx]!; n++;
    }
    out[y * cw + x] = sum / n;
  }
  return out;
}

/** Weighted Jaccard of the two blurred ink maps: how much of the ink lands in the same place.
 *  A page laid out right in another font scores high, a blank page ~0, ink in the wrong place low.
 *  ponytail: 16 px cells (≈ two text lines at 72 dpi) + box blur ignore small shifts and glyph shape.
 *  Upgrade path: multi-scale or structure-aware comparison if a real engine saturates the metric. */
export function inkOverlap(a: Gray, b: Gray): number {
  const cw = Math.ceil(a.w / CELL), ch = Math.ceil(a.h / CELL);
  const A = blur(inkMap(a, a.w, a.h, cw, ch), cw, ch), B = blur(inkMap(b, a.w, a.h, cw, ch), cw, ch);
  let lo = 0, hi = 0;
  for (let i = 0; i < A.length; i++) { lo += Math.min(A[i]!, B[i]!); hi += Math.max(A[i]!, B[i]!); }
  return hi === 0 ? 1 : lo / hi;
}

export function visualScore(orig: Gray[], conv: Gray[]): number {
  if (orig.length === 0) return 1;
  return orig.reduce((s, p, i) => s + (conv[i] ? inkOverlap(p, conv[i]!) : 0), 0) / orig.length;
}
