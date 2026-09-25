"use client";

import Decimal from "decimal.js";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsCategoryForm } from "@/hooks/use-settings-category-form";
import {
  formatPercent,
  fromPercentInput,
  normalizeDecimalInput,
  toPercentInput,
} from "@/lib/format";
import { overheadMarginCategorySchema } from "@/lib/pricing/validation";
import { SettingsField } from "./settings-field";
import type { OverheadMarginFormValues } from "./types";

/** Same formula as `calculateSellingPrice` (`lib/pricing/selling-price.ts`). */
function equivalentMarkup(marginRate: Decimal): Decimal | null {
  if (!marginRate.gte(0) || !marginRate.lt(1)) return null;
  return marginRate.dividedBy(new Decimal(1).minus(marginRate));
}

export function OverheadMarginForm({
  initialValues,
}: {
  initialValues: OverheadMarginFormValues;
}) {
  const [overheadRate, setOverheadRate] = useState(() =>
    toPercentInput(initialValues.overheadRate),
  );
  const [marginRate, setMarginRate] = useState(() =>
    toPercentInput(initialValues.marginRate),
  );
  const { errors, pending, saved, submit } = useSettingsCategoryForm(
    "overheadMargin",
    overheadMarginCategorySchema,
  );

  let markup: Decimal | null = null;
  try {
    markup = equivalentMarkup(new Decimal(fromPercentInput(marginRate)));
  } catch {
    markup = null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({
      overheadRate: fromPercentInput(overheadRate),
      marginRate: fromPercentInput(marginRate),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <SettingsField
        id="overheadRate"
        label="Overhead"
        unit="%"
        value={overheadRate}
        onChange={(value) => setOverheadRate(normalizeDecimalInput(value))}
        error={errors.overheadRate}
      />
      <SettingsField
        id="marginRate"
        label="Margin"
        unit="%"
        value={marginRate}
        onChange={(value) => setMarginRate(normalizeDecimalInput(value))}
        error={errors.marginRate}
      />
      {markup && (
        <p className="text-sm text-slate">
          Equivalent markup: {formatPercent(markup)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" className="rounded-md" disabled={pending}>
          Save changes
        </Button>
        {saved && <span className="text-sm text-slate">Changes saved.</span>}
      </div>
    </form>
  );
}
