import { readFileSync } from "node:fs";
import { extract, type Run } from "@unprint/engine";
import type { Engine } from "./types.js";
import { writeDocx } from "../lib/docx.js";

/** Runs sorted top-to-bottom, left-to-right, grouped into lines by baseline proximity. No layout: this is the
 *  step-02 floor so the bench can score extraction; step 03 replaces it with real paragraphs. */
export function lines(runs: Run[]): string[] {
  const sorted = [...runs].sort((a, b) => a.y - b.y || a.x - b.x);
  const out: Run[][] = [];
  for (const r of sorted) {
    const line = out[out.length - 1];
    if (line && Math.abs(line[0]!.y - r.y) < 0.5 * Math.min(line[0]!.h, r.h)) line.push(r); else out.push([r]);
  }
  return out.map((l) => l.sort((a, b) => a.x - b.x).map((r) => r.text).join(" "));
}

const unprint: Engine = async (pdf, out) => {
  const buf = readFileSync(pdf);
  const pages = await extract(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  writeDocx(pages.flatMap((p) => lines(p.runs)), out);
};
export default unprint;
