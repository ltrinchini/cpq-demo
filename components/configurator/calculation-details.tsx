import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { calculationFormulas } from "@/lib/calculation-details";
import { formatCurrency } from "@/lib/format";
import { COST_LINE_LABELS } from "@/lib/labels";
import { COST_LINES } from "@/lib/pricing/types";
import type { PriceResult } from "@/lib/pricing/types";
import { cn } from "@/lib/utils";
import { RecalculatingAmount } from "./recalculating-amount";

interface CalculationDetailsProps {
  price: PriceResult;
}

/**
 * Each cost line's formula: label and amount on the first line, the formula
 * in `text-xs` below (`docs/design.md`, "Configurator (mobile)"). Shared by
 * the desktop accordion below and the mobile detail sheet, which shows it
 * directly.
 */
export function CalculationDetailsList({ price }: CalculationDetailsProps) {
  const { currency, lines } = price;
  const formulas = calculationFormulas(price);

  return (
    <ul className="grid gap-3">
      {COST_LINES.map((line) => (
        <li key={line}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>{COST_LINE_LABELS[line]}</span>
            <span className="tabular-nums">
              <RecalculatingAmount
                value={formatCurrency(lines[line], currency)}
              />
            </span>
          </div>
          <p className="text-xs text-slate">{formulas[line]}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Show calculation details", desktop only: on mobile, opening the detail
 * sheet is already the deliberate action, so it shows `CalculationDetailsList`
 * directly instead of behind a second toggle (`docs/design.md`, "Configurator
 * (mobile)"). The trigger is a full-width outlined button, so the details
 * read as an action rather than a footnote under the legend.
 */
export function CalculationDetails({ price }: CalculationDetailsProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="calculation-details" className="border-b-0">
        <AccordionTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between rounded-md py-0 hover:no-underline",
          )}
        >
          Show calculation details
        </AccordionTrigger>
        <AccordionContent>
          <div className="pt-2">
            <CalculationDetailsList price={price} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
