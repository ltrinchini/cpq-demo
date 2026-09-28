import { notFound } from "next/navigation";
import { QuoteDetail } from "@/components/quotes/quote-detail";
import { getQuoteByNumber } from "@/lib/db/queries";
import { readVisitorId } from "@/lib/visitor";

interface QuoteDetailPageProps {
  params: Promise<{ number: string }>;
}

export default async function QuoteDetailPage({
  params,
}: QuoteDetailPageProps) {
  const { number } = await params;
  const visitorId = await readVisitorId();
  const quote = visitorId ? await getQuoteByNumber(visitorId, number) : null;
  if (!quote) notFound();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-semibold">{quote.number}</h1>
      <QuoteDetail quote={quote} />
    </main>
  );
}
