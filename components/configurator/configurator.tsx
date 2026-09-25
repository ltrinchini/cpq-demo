"use client";

import { useState } from "react";
import type { Configuration } from "@/lib/pricing/types";
import { OptionsForm } from "./options-form";

/** The 001 reference example (`specs/004-configurator/spec.md`). */
const DEFAULT_CONFIGURATION: Configuration = {
  originId: "ethiopia-yirgacheffe",
  roast: "medium",
  grind: "espresso",
  bagSize: "1kg",
  quantity: 24,
  currency: "CAD",
};

export function Configurator() {
  const [configuration, setConfiguration] = useState<Configuration>(
    DEFAULT_CONFIGURATION,
  );
  const [notes, setNotes] = useState("");

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
    </div>
  );
}
