import { rmSync, existsSync } from "node:fs";
import type { Engine } from "./types.js";
import { run } from "../lib/sh.js";

/** Baseline only. pdf2docx (PyMuPDF) is AGPL: it runs as an external tool via uvx and is never vendored or shipped. */
const pdf2docx: Engine = async (pdf, out) => {
  rmSync(out, { force: true });
  run("uvx", ["pdf2docx", "convert", pdf, "--docx_file", out]);
  if (!existsSync(out)) throw new Error("pdf2docx produced no file");
};
export default pdf2docx;
