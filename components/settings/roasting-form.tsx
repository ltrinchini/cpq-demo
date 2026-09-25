"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsCategoryForm } from "@/hooks/use-settings-category-form";
import {
  fromPercentInput,
  normalizeDecimalInput,
  toPercentInput,
} from "@/lib/format";
import { ROAST_PROFILE_LABELS } from "@/lib/labels";
import { ROAST_PROFILES } from "@/lib/pricing/types";
import { roastingCategorySchema } from "@/lib/pricing/validation";
import { SettingsField } from "./settings-field";
import type { RoastingFormValues } from "./types";

/** Local editing state: `lossRate` as the percentage text the field shows. */
type RoastProfilesState = Record<
  (typeof ROAST_PROFILES)[number],
  { lossRate: string; cycleMinutes: string }
>;

export function RoastingForm({
  initialValues,
}: {
  initialValues: RoastingFormValues;
}) {
  const [roastProfiles, setRoastProfiles] = useState<RoastProfilesState>(
    () =>
      Object.fromEntries(
        ROAST_PROFILES.map((profile) => [
          profile,
          {
            lossRate: toPercentInput(
              initialValues.roastProfiles[profile].lossRate,
            ),
            cycleMinutes: initialValues.roastProfiles[profile].cycleMinutes,
          },
        ]),
      ) as RoastProfilesState,
  );
  const [roasterCapacityKg, setRoasterCapacityKg] = useState(
    initialValues.roasterCapacityKg,
  );
  const { errors, pending, saved, submit } = useSettingsCategoryForm(
    "roasting",
    roastingCategorySchema,
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({
      roastProfiles: Object.fromEntries(
        ROAST_PROFILES.map((profile) => [
          profile,
          {
            lossRate: fromPercentInput(roastProfiles[profile].lossRate),
            cycleMinutes: roastProfiles[profile].cycleMinutes,
          },
        ]),
      ),
      roasterCapacityKg,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {ROAST_PROFILES.map((profile) => (
        <div key={profile} className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            id={`roastProfiles-${profile}-lossRate`}
            label={`${ROAST_PROFILE_LABELS[profile]} loss rate`}
            unit="%"
            value={roastProfiles[profile].lossRate}
            onChange={(value) =>
              setRoastProfiles((current) => ({
                ...current,
                [profile]: {
                  ...current[profile],
                  lossRate: normalizeDecimalInput(value),
                },
              }))
            }
            error={errors[`roastProfiles.${profile}.lossRate`]}
          />
          <SettingsField
            id={`roastProfiles-${profile}-cycleMinutes`}
            label={`${ROAST_PROFILE_LABELS[profile]} batch cycle time`}
            unit="min"
            value={roastProfiles[profile].cycleMinutes}
            onChange={(value) =>
              setRoastProfiles((current) => ({
                ...current,
                [profile]: {
                  ...current[profile],
                  cycleMinutes: normalizeDecimalInput(value),
                },
              }))
            }
            error={errors[`roastProfiles.${profile}.cycleMinutes`]}
          />
        </div>
      ))}
      <SettingsField
        id="roasterCapacityKg"
        label="Roaster capacity"
        unit="kg green coffee / batch"
        value={roasterCapacityKg}
        onChange={(value) => setRoasterCapacityKg(normalizeDecimalInput(value))}
        error={errors.roasterCapacityKg}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" className="rounded-md" disabled={pending}>
          Save changes
        </Button>
        {saved && <span className="text-sm text-slate">Changes saved.</span>}
      </div>
    </form>
  );
}
