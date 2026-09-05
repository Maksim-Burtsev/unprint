import { readFileSync, writeFileSync } from "node:fs";
import { convert } from "@unprint/engine";
import type { Engine } from "./types.js";

const unprint: Engine = async (pdf, out) => {
  const buf = readFileSync(pdf);
  const { docx } = await convert(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  writeFileSync(out, docx);
};
export default unprint;
