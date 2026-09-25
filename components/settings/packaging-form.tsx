"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsCategoryForm } from "@/hooks/use-settings-category-form";
import { normalizeDecimalInput } from "@/lib/format";
import { BAG_SIZE_LABELS } from "@/lib/labels";
import { BAG_SIZES } from "@/lib/pricing/types";
import { packagingCategorySchema } from "@/lib/pricing/validation";
import { SettingsField } from "./settings-field";
import type { SettingsFormValues } from "./types";

export function PackagingForm({
  initialValues,
}: {
  initialValues: Pick<SettingsFormValues, "bagSizes">;
}) {
  const [bagSizes, setBagSizes] = useState(initialValues.bagSizes);
  const { errors, pending, saved, submit } = useSettingsCategoryForm(
    "packaging",
    packagingCategorySchema,
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({
      bagSizes: Object.fromEntries(
        BAG_SIZES.map((bagSize) => [
          bagSize,
          {
            packagingCostCad: bagSizes[bagSize].packagingCostCad,
            packingMinutes: bagSizes[bagSize].packingMinutes,
          },
        ]),
      ),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {BAG_SIZES.map((bagSize) => (
        <div key={bagSize} className="grid gap-4 sm:grid-cols-3">
          <SettingsField
            id={`bagSizes-${bagSize}-weightKg`}
            label={`${BAG_SIZE_LABELS[bagSize]} weight`}
            unit="kg"
            value={bagSizes[bagSize].weightKg}
            readOnly
          />
          <SettingsField
            id={`bagSizes-${bagSize}-packagingCostCad`}
            label={`${BAG_SIZE_LABELS[bagSize]} packaging cost`}
            unit="CAD"
            value={bagSizes[bagSize].packagingCostCad}
            onChange={(value) =>
              setBagSizes((current) => ({
                ...current,
                [bagSize]: {
                  ...current[bagSize],
                  packagingCostCad: normalizeDecimalInput(value),
                },
              }))
            }
            error={errors[`bagSizes.${bagSize}.packagingCostCad`]}
          />
          <SettingsField
            id={`bagSizes-${bagSize}-packingMinutes`}
            label={`${BAG_SIZE_LABELS[bagSize]} packing time`}
            unit="min"
            value={bagSizes[bagSize].packingMinutes}
            onChange={(value) =>
              setBagSizes((current) => ({
                ...current,
                [bagSize]: {
                  ...current[bagSize],
                  packingMinutes: normalizeDecimalInput(value),
                },
              }))
            }
            error={errors[`bagSizes.${bagSize}.packingMinutes`]}
          />
        </div>
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
