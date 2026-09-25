"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsCategoryForm } from "@/hooks/use-settings-category-form";
import { normalizeDecimalInput } from "@/lib/format";
import { quotesCategorySchema } from "@/lib/pricing/validation";
import { SettingsField } from "./settings-field";
import type { QuotesFormValues } from "./types";

export function QuotesForm({
  initialValues,
}: {
  initialValues: QuotesFormValues;
}) {
  const [quoteValidityDays, setQuoteValidityDays] = useState(
    String(initialValues.quoteValidityDays),
  );
  const { errors, pending, saved, submit } = useSettingsCategoryForm(
    "quotes",
    quotesCategorySchema,
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({ quoteValidityDays });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <SettingsField
        id="quoteValidityDays"
        label="Quote validity"
        unit="days"
        value={quoteValidityDays}
        onChange={(value) => setQuoteValidityDays(normalizeDecimalInput(value))}
        inputMode="numeric"
        error={errors.quoteValidityDays}
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
