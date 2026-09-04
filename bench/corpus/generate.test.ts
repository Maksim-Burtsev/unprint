import { test, expect } from "vitest";
import { invoiceHtml, resumeHtml, bookHtml } from "./generate.js";

test("generators are seeded and deterministic", () => {
  for (const gen of [invoiceHtml, resumeHtml]) {
    expect(gen(3)).toBe(gen(3));
    expect(gen(3)).not.toBe(gen(4));
    expect(gen(3)).toContain("<table");
  }
});

test("bookHtml strips Gutenberg markers and marks chapter headings", () => {
  const html = bookHtml("front matter\n*** START OF THE PROJECT GUTENBERG EBOOK X ***\n\nCHAPTER I\n\nIt was a bright day.\n\n*** END OF THE PROJECT GUTENBERG EBOOK X ***\nlicense blah");
  expect(html).toContain("<h2>CHAPTER I</h2>");
  expect(html).toContain("It was a bright day.");
  expect(html).not.toContain("front matter");
  expect(html).not.toContain("license blah");
});
