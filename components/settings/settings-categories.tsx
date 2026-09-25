"use client";

import { useState } from "react";
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
import { RoastingForm } from "./roasting-form";
import type { SettingsFormValues } from "./types";

/** Category labels, in the order shown in the left nav (`docs/design.md`, "Settings"). */
const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  greenCoffee: "Green coffee",
  roasting: "Roasting",
  packaging: "Packaging",
  labor: "Labor",
  overheadMargin: "Overhead and margin",
  currencies: "Currencies",
  quotes: "Quotes",
};

export function SettingsCategories({
  initialValues,
}: {
  initialValues: SettingsFormValues;
}) {
  const [selected, setSelected] = useState<SettingsCategory>("greenCoffee");

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <nav aria-label="Settings categories" className="mb-6 lg:mb-0 lg:w-56">
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
      <div className="flex-1 rounded-lg border border-frost bg-surface p-4 lg:p-6">
        {selected === "greenCoffee" && (
          <GreenCoffeeForm
            initialValues={{
              greenCoffeeUsdPerKg: initialValues.greenCoffeeUsdPerKg,
            }}
          />
        )}
        {selected === "roasting" && (
          <RoastingForm
            initialValues={{
              roastProfiles: initialValues.roastProfiles,
              roasterCapacityKg: initialValues.roasterCapacityKg,
            }}
          />
        )}
        {selected === "packaging" && (
          <PackagingForm initialValues={{ bagSizes: initialValues.bagSizes }} />
        )}
        {selected === "labor" && (
          <LaborForm
            initialValues={{
              hourlyRatesCad: initialValues.hourlyRatesCad,
              grindMinutesPerKg: initialValues.grindMinutesPerKg,
            }}
          />
        )}
        {selected === "overheadMargin" && (
          <OverheadMarginForm
            initialValues={{
              overheadRate: initialValues.overheadRate,
              marginRate: initialValues.marginRate,
            }}
          />
        )}
        {selected === "currencies" && (
          <CurrenciesForm
            initialValues={{
              exchangeRatesCad: initialValues.exchangeRatesCad,
            }}
          />
        )}
        {selected === "quotes" && (
          <QuotesForm
            initialValues={{
              quoteValidityDays: initialValues.quoteValidityDays,
            }}
          />
        )}
      </div>
    </div>
  );
}
