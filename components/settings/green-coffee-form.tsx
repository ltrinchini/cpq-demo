"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsCategoryForm } from "@/hooks/use-settings-category-form";
import { ORIGIN_LABELS } from "@/lib/labels";
import { normalizeDecimalInput } from "@/lib/format";
import { ORIGINS } from "@/lib/pricing/types";
import { greenCoffeeCategorySchema } from "@/lib/pricing/validation";
import { SettingsField } from "./settings-field";
import type { GreenCoffeeFormValues } from "./types";

export function GreenCoffeeForm({
  initialValues,
}: {
  initialValues: GreenCoffeeFormValues;
}) {
  const [greenCoffeeUsdPerKg, setGreenCoffeeUsdPerKg] = useState(
    initialValues.greenCoffeeUsdPerKg,
  );
  const { errors, pending, saved, submit } = useSettingsCategoryForm(
    "greenCoffee",
    greenCoffeeCategorySchema,
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({ greenCoffeeUsdPerKg });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {ORIGINS.map((origin) => (
        <SettingsField
          key={origin}
          id={`greenCoffeeUsdPerKg-${origin}`}
          label={ORIGIN_LABELS[origin]}
          unit="US$/kg"
          value={greenCoffeeUsdPerKg[origin]}
          onChange={(value) =>
            setGreenCoffeeUsdPerKg((current) => ({
              ...current,
              [origin]: normalizeDecimalInput(value),
            }))
          }
          error={errors[`greenCoffeeUsdPerKg.${origin}`]}
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
