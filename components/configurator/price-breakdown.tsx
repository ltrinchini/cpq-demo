import { breakdownWidths } from "@/lib/breakdown";
import { formatCurrency } from "@/lib/format";
import { COST_LINE_LABELS } from "@/lib/labels";
import { COST_LINES } from "@/lib/pricing/types";
import type { PriceResult } from "@/lib/pricing/types";

/** Roast scale colours, in the breakdown bar order (`docs/design.md`). */
export const COST_LINE_COLOR_CLASS: Record<
  (typeof COST_LINES)[number],
  string
> = {
  greenCoffee: "bg-cost-green",
  packaging: "bg-cost-packaging",
  labor: "bg-cost-labor",
  overhead: "bg-cost-overhead",
  margin: "bg-cost-margin",
};

interface PriceBreakdownProps {
  price: PriceResult;
}

/**
 * Breakdown bar with the roast scale, and its legend as a vertical list
 * below the bar, never beside it (`docs/design.md`). Shared by the desktop
 * price summary and the mobile detail sheet.
 */
export function PriceBreakdown({ price }: PriceBreakdownProps) {
  const { currency, total, lines } = price;
  const widths = breakdownWidths(lines, total);

  return (
    <div className="grid gap-4">
      <div className="flex h-3 overflow-hidden rounded-md">
        {COST_LINES.map((line) => (
          <span
            key={line}
            className={COST_LINE_COLOR_CLASS[line]}
            style={{ width: `${widths[line].toFixed(4)}%` }}
          />
        ))}
      </div>

      <ul className="grid gap-2">
        {COST_LINES.map((line) => (
          <li key={line} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className={`size-3 rounded-sm ${COST_LINE_COLOR_CLASS[line]}`}
              />
              {COST_LINE_LABELS[line]}
            </span>
            <span className="text-sm tabular-nums">
              {formatCurrency(lines[line], currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
