import { test, expect } from "vitest";
import { lines } from "./unprint.js";
const run = (text: string, x: number, y: number) => ({ text, x, y, w: 10, h: 10, font: "F", size: 10, bold: false, italic: false, color: "#000000" });
test("lines groups by baseline and orders left to right", () => {
  expect(lines([run("b", 50, 100), run("a", 10, 102), run("c", 10, 130)])).toEqual(["a b", "c"]);
});
