import type { z } from "zod";

/**
 * One message per field path (`"exchangeRatesCad.USD"`), first issue wins.
 * Shared between the server-side `saveSettingsCategory` Server Action and
 * the client-side pre-submit validation in the settings forms, so both
 * report errors the same way.
 */
export function fieldErrorsFromZodError(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!(path in errors)) errors[path] = issue.message;
  }
  return errors;
}
