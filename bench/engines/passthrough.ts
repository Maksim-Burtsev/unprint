import type { Engine } from "./types.js";
import { pdfText } from "../lib/text.js";
import { writeDocx } from "../lib/docx.js";

/** The floor: every text line of the PDF becomes a plain paragraph. No layout, no images. */
const passthrough: Engine = async (pdf, out) => {
  const pages = await pdfText(pdf);
  writeDocx(pages.flatMap((p) => p.split("\n").map((l) => l.trim()).filter(Boolean)), out);
};
export default passthrough;
