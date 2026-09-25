"use client";

import { useState, useTransition } from "react";
import type { z } from "zod";
import { saveSettingsCategory } from "@/lib/actions";
import type { SettingsCategory } from "@/lib/pricing/validation";
import { fieldErrorsFromZodError } from "@/lib/zod-errors";

export interface SettingsCategoryForm {
  errors: Record<string, string>;
  pending: boolean;
  saved: boolean;
  /** Validates locally first (`docs/design.md`, "Settings"), then saves. */
  submit: (data: unknown) => void;
}

/**
 * Shared plumbing for a settings category form: local validation against
 * the category's own Zod schema, the `saveSettingsCategory` Server Action
 * call, error merging and the save confirmation. Each category form keeps
 * its own field state and layout.
 */
export function useSettingsCategoryForm(
  category: SettingsCategory,
  schema: z.ZodType,
): SettingsCategoryForm {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(data: unknown) {
    setSaved(false);

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrorsFromZodError(parsed.error));
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await saveSettingsCategory(category, data);
      if (result.success) {
        setSaved(true);
      } else {
        setErrors(result.fieldErrors);
      }
    });
  }

  return { errors, pending, saved, submit };
}
