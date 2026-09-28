import { notFound } from "next/navigation";
import { QuoteDetail } from "@/components/quotes/quote-detail";
import { Button } from "@/components/ui/button";
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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold">{quote.number}</h1>
        <Button asChild className="w-full lg:w-auto">
          <a href={`/quotes/${quote.number}/pdf`}>Download PDF</a>
        </Button>
      </div>
      <QuoteDetail quote={quote} />
    </main>
  );
}
