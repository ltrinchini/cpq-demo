import { formatCurrency } from "@/lib/format";
import type { Configuration, PriceResult } from "@/lib/pricing/types";
import { CalculationDetails } from "./calculation-details";
import { PriceBreakdown } from "./price-breakdown";
import { RecalculatingAmount } from "./recalculating-amount";
import { SaveQuoteDialog } from "./save-quote-dialog";

interface PriceSummaryProps {
  price: PriceResult;
  configuration: Configuration;
  notes: string;
}

/**
 * Total price, breakdown bar, cost lines and calculation details
 * (`docs/design.md`, "Configurator (desktop)"). Desktop only: below `lg`,
 * `MobilePriceBar` replaces it with a sticky bar and a detail sheet.
 */
export function PriceSummary({
  price,
  configuration,
  notes,
}: PriceSummaryProps) {
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

      <SaveQuoteDialog
        configuration={configuration}
        notes={notes}
        triggerClassName="rounded-md"
      />
    </div>
  );
}
