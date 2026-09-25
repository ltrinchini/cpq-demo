"use client";

import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  SETTINGS_CATEGORIES,
  type SettingsCategory,
} from "@/lib/pricing/validation";
import { CurrenciesForm } from "./currencies-form";
import { GreenCoffeeForm } from "./green-coffee-form";
import { LaborForm } from "./labor-form";
import { OverheadMarginForm } from "./overhead-margin-form";
import { PackagingForm } from "./packaging-form";
import { QuotesForm } from "./quotes-form";
import { ResetDemoData } from "./reset-demo-data";
import { RoastingForm } from "./roasting-form";
import type { SettingsFormValues } from "./types";

/** Category labels, in the order shown in the nav (`docs/design.md`, "Settings"). */
const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  greenCoffee: "Green coffee",
  roasting: "Roasting",
  packaging: "Packaging",
  labor: "Labor",
  overheadMargin: "Overhead and margin",
  currencies: "Currencies",
  quotes: "Quotes",
};

/**
 * One form per category, each narrowed to the slice of `initialValues` it
 * edits. Shared by the desktop single-panel view and the mobile accordion,
 * so the category → form mapping is defined once.
 */
const CATEGORY_PANELS: Record<
  SettingsCategory,
  (values: SettingsFormValues) => ReactNode
> = {
  greenCoffee: (values) => (
    <GreenCoffeeForm
      initialValues={{ greenCoffeeUsdPerKg: values.greenCoffeeUsdPerKg }}
    />
  ),
  roasting: (values) => (
    <RoastingForm
      initialValues={{
        roastProfiles: values.roastProfiles,
        roasterCapacityKg: values.roasterCapacityKg,
      }}
    />
  ),
  packaging: (values) => (
    <PackagingForm initialValues={{ bagSizes: values.bagSizes }} />
  ),
  labor: (values) => (
    <LaborForm
      initialValues={{
        hourlyRatesCad: values.hourlyRatesCad,
        grindMinutesPerKg: values.grindMinutesPerKg,
      }}
    />
  ),
  overheadMargin: (values) => (
    <OverheadMarginForm
      initialValues={{
        overheadRate: values.overheadRate,
        marginRate: values.marginRate,
      }}
    />
  ),
  currencies: (values) => (
    <CurrenciesForm
      initialValues={{ exchangeRatesCad: values.exchangeRatesCad }}
    />
  ),
  quotes: (values) => (
    <QuotesForm
      initialValues={{ quoteValidityDays: values.quoteValidityDays }}
    />
  ),
};

export function SettingsCategories({
  initialValues,
}: {
  initialValues: SettingsFormValues;
}) {
  const [selected, setSelected] = useState<SettingsCategory>("greenCoffee");

  return (
    <>
      <div className="hidden lg:flex lg:items-start lg:gap-8">
        <nav aria-label="Settings categories" className="lg:w-56">
          <ul className="grid gap-1">
            {SETTINGS_CATEGORIES.map((category) => (
              <li key={category}>
                <button
                  type="button"
                  aria-current={selected === category ? "page" : undefined}
                  onClick={() => setSelected(category)}
                  className={cn(
                    "min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-action",
                    selected === category
                      ? "bg-mist text-action"
                      : "text-slate hover:text-ink",
                  )}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 rounded-lg border border-frost bg-surface p-6">
          {CATEGORY_PANELS[selected](initialValues)}
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["greenCoffee"]}
        className="lg:hidden"
      >
        {SETTINGS_CATEGORIES.map((category) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="min-h-11">
              {CATEGORY_LABELS[category]}
            </AccordionTrigger>
            <AccordionContent>
              {CATEGORY_PANELS[category](initialValues)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <ResetDemoData />
    </>
  );
}
