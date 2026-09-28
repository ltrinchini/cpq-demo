import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import type { QuoteDetail } from "@/lib/db/queries";
import { calculatePrice } from "@/lib/pricing";
import {
  referenceConfiguration,
  referenceSettings,
} from "@/lib/pricing/test-fixtures";
import { QuoteDocument } from "./quote-document";

function referenceQuote(): QuoteDetail {
  const configuration = referenceConfiguration();
  const resultSnapshot = calculatePrice(referenceSettings(), configuration);

  return {
    number: "Q-260305-0001",
    customerName: "Riverside Café",
    notes: "Deliver before the weekend rush.",
    currency: configuration.currency,
    configuration,
    resultSnapshot,
    createdAt: new Date("2026-03-05T12:00:00Z"),
    validUntil: new Date("2026-04-04T12:00:00Z"),
  };
}

describe("QuoteDocument", () => {
  it("renders a valid PDF from a frozen quote", async () => {
    const buffer = await renderToBuffer(
      <QuoteDocument quote={referenceQuote()} />,
    );

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it("renders without notes", async () => {
    const quote = { ...referenceQuote(), notes: null };

    await expect(
      renderToBuffer(<QuoteDocument quote={quote} />),
    ).resolves.toBeInstanceOf(Buffer);
  });
});
