import { QuoteList } from "@/components/quotes/quote-list";
import { listQuotes } from "@/lib/db/queries";
import { readVisitorId } from "@/lib/visitor";

export default async function QuotesPage() {
  const visitorId = await readVisitorId();
  const quotes = visitorId ? await listQuotes(visitorId) : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Quotes</h1>
      <QuoteList quotes={quotes} />
    </main>
  );
}
