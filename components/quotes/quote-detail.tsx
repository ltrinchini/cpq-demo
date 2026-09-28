import { PriceBreakdown } from "@/components/configurator/price-breakdown";
import type { QuoteDetail as QuoteDetailData } from "@/lib/db/queries";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";
import {
  BAG_SIZE_LABELS,
  GRIND_LABELS,
  ORIGIN_LABELS,
  ROAST_PROFILE_LABELS,
} from "@/lib/labels";

interface QuoteDetailProps {
  quote: QuoteDetailData;
}

function OrderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * The `/quotes/[number]` preview: a faithful read of the frozen quote, in
 * the same order as the PDF it stands in for — header, customer, order,
 * price breakdown, total, terms (`docs/design.md`, "Quotes" and "PDF quote
 * — Lantern Roasters").
 */
export function QuoteDetail({ quote }: QuoteDetailProps) {
  const { configuration, resultSnapshot, currency } = quote;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 rounded-lg border border-frost bg-surface p-6">
      <div className="flex flex-col gap-1 border-b border-frost pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-sm text-slate">{formatDate(quote.createdAt)}</p>
        <p className="text-sm text-slate">
          Valid until {formatDate(quote.validUntil)}
        </p>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold">Customer</h3>
        <p>{quote.customerName}</p>
        {quote.notes && (
          <p className="mt-1 text-sm text-slate">{quote.notes}</p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Order</h3>
        <dl className="grid gap-1 text-sm">
          <OrderRow
            label="Coffee"
            value={ORIGIN_LABELS[configuration.originId]}
          />
          <OrderRow
            label="Roast"
            value={ROAST_PROFILE_LABELS[configuration.roast]}
          />
          <OrderRow label="Grind" value={GRIND_LABELS[configuration.grind]} />
          <OrderRow
            label="Bag size"
            value={BAG_SIZE_LABELS[configuration.bagSize]}
          />
          <OrderRow
            label="Quantity"
            value={formatQuantity(configuration.quantity, "bag", "bags")}
          />
          <OrderRow
            label="Unit price"
            value={`${formatCurrency(resultSnapshot.unitPrice, currency)} / bag`}
          />
        </dl>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Price breakdown</h3>
        <PriceBreakdown price={resultSnapshot} />
      </div>

      <div className="flex items-baseline justify-between border-t border-frost pt-4">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-2xl font-semibold tabular-nums">
          {formatCurrency(resultSnapshot.total, currency)}
        </span>
      </div>

      <p className="text-xs text-slate">Prices exclude applicable taxes.</p>
    </div>
  );
}
