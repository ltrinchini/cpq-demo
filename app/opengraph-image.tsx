import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Lantern Roasters · CPQ — configure, price and quote a coffee order";

/**
 * Share preview for LinkedIn and other link previews (`docs/roadmap.md`,
 * "Sharing metadata"). Reuses the price breakdown's roast scale
 * (`docs/design.md`, "Application colours") since it's the demo's most
 * recognizable element, in the same proportions as the default
 * configuration (`lib/db/seed.ts`).
 */
const BREAKDOWN = [
  { color: "#A9B98C", label: "Green coffee", grow: 43.7 },
  { color: "#D8C6A1", label: "Packaging", grow: 5.1 },
  { color: "#B0875A", label: "Labor", grow: 7.7 },
  { color: "#7A5536", label: "Overhead", grow: 8.5 },
  { color: "#3D2A1E", label: "Margin", grow: 35 },
];

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#F6F7F6",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: "serif",
            fontSize: 64,
            fontWeight: 600,
            color: "#3B2619",
          }}
        >
          Lantern Roasters
        </div>
        <div style={{ fontSize: 30, color: "#5A635D", marginTop: 12 }}>
          Configure, price and quote — a CPQ demo for a coffee roastery
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 44,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {BREAKDOWN.map((segment) => (
            <div
              key={segment.label}
              style={{
                display: "flex",
                flexGrow: segment.grow,
                backgroundColor: segment.color,
                height: "100%",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 24, gap: 32 }}>
          {BREAKDOWN.map((segment) => (
            <div
              key={segment.label}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: segment.color,
                }}
              />
              <div style={{ fontSize: 20, color: "#1C211E" }}>
                {segment.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
