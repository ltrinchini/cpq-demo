import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { ensureSandbox, getQuoteByNumber } from "@/lib/db/queries";
import { QuoteDocument } from "@/lib/pdf/quote-document";
import { readVisitorId } from "@/lib/visitor";

interface QuotePdfRouteParams {
  params: Promise<{ number: string }>;
}

/**
 * Streams the quote's PDF, named so it opens in the browser's viewer
 * (`docs/design.md`, "Quotes": `quote-<number>.pdf`). Same frozen data as
 * the `/quotes/[number]` preview: never recalculated. On the first visit's
 * virtual sample quote (`getQuoteByNumber`, `lib/db/queries.ts`),
 * downloading it materializes the sandbox, so the number stays valid
 * afterward.
 */
export async function GET(_request: Request, { params }: QuotePdfRouteParams) {
  const { number } = await params;
  const visitorId = await readVisitorId();
  const quote = visitorId ? await getQuoteByNumber(visitorId, number) : null;
  if (!quote || !visitorId) {
    return new NextResponse("Not found", { status: 404 });
  }
  await ensureSandbox(visitorId);

  const buffer = await renderToBuffer(<QuoteDocument quote={quote} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quote-${quote.number}.pdf"`,
    },
  });
}
