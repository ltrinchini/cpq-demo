import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { calculationFormulas } from "@/lib/calculation-details";
import { formatCurrency } from "@/lib/format";
import { COST_LINE_LABELS } from "@/lib/labels";
import { COST_LINES } from "@/lib/pricing/types";
import type { PriceResult } from "@/lib/pricing/types";

interface CalculationDetailsProps {
  price: PriceResult;
}

/**
 * "Show calculation details": the formula behind each cost line, so nothing
 * in the price is a black box (`docs/design.md`, "Configurator (mobile)").
 */
export function CalculationDetails({ price }: CalculationDetailsProps) {
  const { currency, lines } = price;
  const formulas = calculationFormulas(price);

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="calculation-details" className="border-b-0">
        <AccordionTrigger className="rounded-none border-none py-0 text-sm font-normal no-underline hover:underline">
          Show calculation details
        </AccordionTrigger>
        <AccordionContent>
          <ul className="grid gap-3 pt-2">
            {COST_LINES.map((line) => (
              <li key={line}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{COST_LINE_LABELS[line]}</span>
                  <span className="tabular-nums">
                    {formatCurrency(lines[line], currency)}
                  </span>
                </div>
                <p className="text-xs text-slate">{formulas[line]}</p>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
