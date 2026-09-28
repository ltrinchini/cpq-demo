"use client";

import { ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { formatCurrency } from "@/lib/format";
import type { Configuration, PriceResult } from "@/lib/pricing/types";
import { CalculationDetailsList } from "./calculation-details";
import { PriceBreakdown } from "./price-breakdown";
import { RecalculatingAmount } from "./recalculating-amount";
import { SaveQuoteDialog } from "./save-quote-dialog";

interface MobilePriceBarProps {
  price: PriceResult;
  configuration: Configuration;
  notes: string;
}

/**
 * Mobile sticky bottom bar and its detail sheet (`docs/design.md`,
 * "Configurator (mobile)"): total price, unit price and "Save quote" stay
 * reachable while configuring; tapping the price area opens the full
 * breakdown. Replaces `PriceSummary` below `lg`.
 */
export function MobilePriceBar({
  price,
  configuration,
  notes,
}: MobilePriceBarProps) {
  const { currency, total, unitPrice } = price;

  return (
    <Drawer>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-frost bg-surface px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-lg lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <DrawerTrigger className="flex min-w-0 cursor-pointer flex-col items-start text-left">
            <span className="flex items-center gap-1 text-2xl font-semibold tabular-nums">
              <RecalculatingAmount value={formatCurrency(total, currency)} />
              <ChevronUpIcon aria-hidden className="size-4 text-slate" />
            </span>
            <span className="text-sm text-slate tabular-nums">
              <RecalculatingAmount
                value={formatCurrency(unitPrice, currency)}
              />{" "}
              / bag
            </span>
          </DrawerTrigger>
          <SaveQuoteDialog
            configuration={configuration}
            notes={notes}
            triggerClassName="shrink-0 rounded-md"
          />
        </div>
      </div>

      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between">
          <DrawerTitle>Price breakdown</DrawerTitle>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="grid gap-6 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <PriceBreakdown price={price} />

          <div>
            <h3 className="mb-3 text-sm font-semibold">Calculation details</h3>
            <CalculationDetailsList price={price} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
