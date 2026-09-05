import { copyFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Engine } from "./types.js";

/** Manual competitor: DOCX files converted by hand on iLovePDF / Smallpdf / Adobe and dropped under
 *  bench/competitors/<name>/<id>.docx (gitignored). Selected with `--engine competitor:<name>`,
 *  which passes <name> through ENGINE_VARIANT. Documents with no file count as errors. */
const competitor: Engine = async (pdf, out) => {
  const variant = process.env.ENGINE_VARIANT;
  if (!variant) throw new Error("usage: --engine competitor:<name>");
  const id = basename(pdf, ".pdf");
  const src = join(dirname(fileURLToPath(import.meta.url)), "..", "competitors", variant, `${id}.docx`);
  if (!existsSync(src)) throw new Error(`no manual DOCX for ${id} under bench/competitors/${variant}/`);
  copyFileSync(src, out);
};
export default competitor;
