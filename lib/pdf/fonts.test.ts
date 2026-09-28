import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FONT_SANS, FONT_SERIF, registerPdfFonts } from "./fonts";

describe("registerPdfFonts", () => {
  it("registers without throwing, and is idempotent", () => {
    expect(() => registerPdfFonts()).not.toThrow();
    expect(() => registerPdfFonts()).not.toThrow();
  });

  it("exposes the family names used to build the PDF document", () => {
    expect(FONT_SANS).toBe("IBM Plex Sans");
    expect(FONT_SERIF).toBe("Source Serif 4");
  });

  it("ships the regular and semi-bold TTF files it registers", () => {
    const fontsDir = path.join(process.cwd(), "public", "fonts");

    for (const file of [
      "IBMPlexSans-Regular.ttf",
      "IBMPlexSans-SemiBold.ttf",
      "SourceSerif4-Regular.ttf",
      "SourceSerif4-SemiBold.ttf",
    ]) {
      expect(fs.existsSync(path.join(fontsDir, file))).toBe(true);
    }
  });
});
