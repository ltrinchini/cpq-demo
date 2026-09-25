"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsCategoryForm } from "@/hooks/use-settings-category-form";
import { normalizeDecimalInput } from "@/lib/format";
import { CURRENCY_LABELS } from "@/lib/labels";
import { CURRENCIES, type ForeignCurrency } from "@/lib/pricing/types";
import { currenciesCategorySchema } from "@/lib/pricing/validation";
import { SettingsField } from "./settings-field";
import type { CurrenciesFormValues } from "./types";

const FOREIGN_CURRENCIES = CURRENCIES.filter(
  (currency): currency is ForeignCurrency => currency !== "CAD",
);

export function CurrenciesForm({
  initialValues,
}: {
  initialValues: CurrenciesFormValues;
}) {
  const [exchangeRatesCad, setExchangeRatesCad] = useState(
    initialValues.exchangeRatesCad,
  );
  const { errors, pending, saved, submit } = useSettingsCategoryForm(
    "currencies",
    currenciesCategorySchema,
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({ exchangeRatesCad });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {FOREIGN_CURRENCIES.map((currency) => (
        <SettingsField
          key={currency}
          id={`exchangeRatesCad-${currency}`}
          label={CURRENCY_LABELS[currency]}
          unit={`CAD / ${currency}`}
          value={exchangeRatesCad[currency]}
          onChange={(value) =>
            setExchangeRatesCad((current) => ({
              ...current,
              [currency]: normalizeDecimalInput(value),
            }))
          }
          error={errors[`exchangeRatesCad.${currency}`]}
        />
      ))}
      <div className="flex items-center gap-3">
        <Button type="submit" className="rounded-md" disabled={pending}>
          Save changes
        </Button>
        {saved && <span className="text-sm text-slate">Changes saved.</span>}
      </div>
    </form>
  );
}
