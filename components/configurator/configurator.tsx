"use client";

import { useMemo, useState } from "react";
import type { SettingsFormValues } from "@/components/settings/types";
import { calculatePrice } from "@/lib/pricing";
import type { Configuration } from "@/lib/pricing/types";
import { pricingSettingsSchema } from "@/lib/pricing/validation";
import { OptionsForm } from "./options-form";
import { PriceSummary } from "./price-summary";

/** The 001 reference example (`specs/004-configurator/spec.md`). */
const DEFAULT_CONFIGURATION: Configuration = {
  originId: "ethiopia-yirgacheffe",
  roast: "medium",
  grind: "espresso",
  bagSize: "1kg",
  quantity: 24,
  currency: "CAD",
};

interface ConfiguratorProps {
  /**
   * The visitor's settings, as string leaves: a `Decimal` can't be passed
   * as a prop from a Server Component (`components/settings/types.ts`).
   * Reconstructed into a `PricingSettings` below.
   */
  settingsFormValues: SettingsFormValues;
}

export function Configurator({ settingsFormValues }: ConfiguratorProps) {
  const [configuration, setConfiguration] = useState<Configuration>(
    DEFAULT_CONFIGURATION,
  );
  const [notes, setNotes] = useState("");

  const settings = useMemo(
    () => pricingSettingsSchema.parse(settingsFormValues),
    [settingsFormValues],
  );
  const price = useMemo(
    () => calculatePrice(settings, configuration),
    [settings, configuration],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <OptionsForm
          configuration={configuration}
          onConfigurationChange={setConfiguration}
          notes={notes}
          onNotesChange={setNotes}
        />
      </div>
      <div className="lg:sticky lg:top-6 lg:col-span-2 lg:self-start">
        <PriceSummary price={price} />
      </div>
    </div>
  );
}
