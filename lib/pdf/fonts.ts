import path from "node:path";
import { Font } from "@react-pdf/renderer";

const fontsDir = path.join(process.cwd(), "public", "fonts");

export const FONT_SANS = "IBM Plex Sans";
export const FONT_SERIF = "Source Serif 4";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;

  Font.register({
    family: FONT_SANS,
    fonts: [
      { src: path.join(fontsDir, "IBMPlexSans-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontsDir, "IBMPlexSans-SemiBold.ttf"), fontWeight: 600 },
    ],
  });

  Font.register({
    family: FONT_SERIF,
    fonts: [
      { src: path.join(fontsDir, "SourceSerif4-Regular.ttf"), fontWeight: 400 },
      {
        src: path.join(fontsDir, "SourceSerif4-SemiBold.ttf"),
        fontWeight: 600,
      },
    ],
  });

  registered = true;
}
