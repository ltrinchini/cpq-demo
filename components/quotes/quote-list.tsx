import Link from "next/link";
import type { QuoteListItem } from "@/lib/db/queries";
import { formatCurrency, formatDate } from "@/lib/format";

interface QuoteListProps {
  quotes: QuoteListItem[];
}

/**
 * The `/quotes` list: a table on desktop, a list of fully tappable rows on
 * mobile, and an empty state suggesting the next action (`docs/design.md`,
 * "Quotes" and "Interface copy").
 */
export function QuoteList({ quotes }: QuoteListProps) {
  if (quotes.length === 0) {
    return (
      <p className="text-sm text-slate">
        No quotes yet.{" "}
        <Link
          href="/"
          className="text-action underline-offset-4 hover:underline"
        >
          Configure an order
        </Link>{" "}
        to create the first one.
      </p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm lg:table">
        <thead>
          <tr className="border-b border-frost text-slate">
            <th className="py-2 pr-4 font-medium">Number</th>
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Total</th>
            <th className="py-2 font-medium">Currency</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr
              key={quote.number}
              className="border-b border-frost last:border-0 hover:bg-mist"
            >
              <td className="py-3 pr-4 font-medium">
                <Link
                  href={`/quotes/${quote.number}`}
                  className="underline-offset-4 hover:underline"
                >
                  {quote.number}
                </Link>
              </td>
              <td className="py-3 pr-4">{quote.customerName}</td>
              <td className="py-3 pr-4 text-slate">
                {formatDate(quote.createdAt)}
              </td>
              <td className="py-3 pr-4 tabular-nums">
                {formatCurrency(quote.total, quote.currency)}
              </td>
              <td className="py-3">{quote.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-frost lg:hidden">
        {quotes.map((quote) => (
          <li key={quote.number}>
            <Link
              href={`/quotes/${quote.number}`}
              className="flex flex-col gap-0.5 py-3"
            >
              <span className="flex items-center justify-between gap-4 font-medium">
                <span>{quote.number}</span>
                <span className="tabular-nums">
                  {formatCurrency(quote.total, quote.currency)}
                </span>
              </span>
              <span className="flex items-center justify-between gap-4 text-sm text-slate">
                <span>{quote.customerName}</span>
                <span>{formatDate(quote.createdAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
