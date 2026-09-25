"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsCategoryForm } from "@/hooks/use-settings-category-form";
import { normalizeDecimalInput } from "@/lib/format";
import { GRIND_LABELS, STATION_LABELS } from "@/lib/labels";
import { GRINDS, STATIONS } from "@/lib/pricing/types";
import { laborCategorySchema } from "@/lib/pricing/validation";
import { SettingsField } from "./settings-field";
import type { LaborFormValues } from "./types";

export function LaborForm({
  initialValues,
}: {
  initialValues: LaborFormValues;
}) {
  const [hourlyRatesCad, setHourlyRatesCad] = useState(
    initialValues.hourlyRatesCad,
  );
  const [grindMinutesPerKg, setGrindMinutesPerKg] = useState(
    initialValues.grindMinutesPerKg,
  );
  const { errors, pending, saved, submit } = useSettingsCategoryForm(
    "labor",
    laborCategorySchema,
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({ hourlyRatesCad, grindMinutesPerKg });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {STATIONS.map((station) => (
        <SettingsField
          key={station}
          id={`hourlyRatesCad-${station}`}
          label={`${STATION_LABELS[station]} hourly rate`}
          unit="CAD/hr"
          value={hourlyRatesCad[station]}
          onChange={(value) =>
            setHourlyRatesCad((current) => ({
              ...current,
              [station]: normalizeDecimalInput(value),
            }))
          }
          error={errors[`hourlyRatesCad.${station}`]}
        />
      ))}
      {GRINDS.map((grind) => (
        <SettingsField
          key={grind}
          id={`grindMinutesPerKg-${grind}`}
          label={`${GRIND_LABELS[grind]} grinding time`}
          unit="min/kg"
          value={grindMinutesPerKg[grind]}
          onChange={(value) =>
            setGrindMinutesPerKg((current) => ({
              ...current,
              [grind]: normalizeDecimalInput(value),
            }))
          }
          error={errors[`grindMinutesPerKg.${grind}`]}
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
