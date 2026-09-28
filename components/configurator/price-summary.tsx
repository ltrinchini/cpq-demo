import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { PriceResult } from "@/lib/pricing/types";
import { CalculationDetails } from "./calculation-details";
import { PriceBreakdown } from "./price-breakdown";
import { RecalculatingAmount } from "./recalculating-amount";

interface PriceSummaryProps {
  price: PriceResult;
}

/**
 * Total price, breakdown bar, cost lines and calculation details
 * (`docs/design.md`, "Configurator (desktop)"). Desktop only: below `lg`,
 * `MobilePriceBar` replaces it with a sticky bar and a detail sheet.
 */
export function PriceSummary({ price }: PriceSummaryProps) {
  const { currency, total, unitPrice, pricePerKg } = price;

  return (
    <div className="hidden gap-4 rounded-lg border border-frost bg-surface p-6 lg:grid">
      <div>
        <h2 className="text-lg font-semibold">Total price</h2>
        <p className="text-3xl font-semibold tabular-nums">
          <RecalculatingAmount value={formatCurrency(total, currency)} />
        </p>
        <p className="text-sm text-slate tabular-nums">
          <RecalculatingAmount value={formatCurrency(unitPrice, currency)} /> /
          bag
        </p>
        <p className="text-sm text-slate tabular-nums">
          <RecalculatingAmount value={formatCurrency(pricePerKg, currency)} /> /
          kg
        </p>
      </div>

      <PriceBreakdown price={price} />

      <CalculationDetails price={price} />

      <Button type="button" className="rounded-md">
        Save quote
      </Button>
    </div>
  );
}
