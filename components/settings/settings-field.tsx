import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsFieldProps {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string;
  readOnly?: boolean;
  inputMode?: "decimal" | "numeric";
}

/**
 * One editable row: label, input with the unit as a suffix, error message
 * below (`docs/design.md`, "Settings"). `readOnly` renders the value as
 * plain text instead of an input, for the one field that can't be edited
 * (bag weight). The unit column has a fixed width, so inputs line up within
 * a `SettingsFieldGrid` column whatever the unit's length.
 */
export function SettingsField({
  id,
  label,
  unit,
  value,
  onChange,
  error,
  readOnly = false,
  inputMode = "decimal",
}: SettingsFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {readOnly ? (
          <p id={id} className="text-sm text-slate">
            {value}
          </p>
        ) : (
          <Input
            id={id}
            className="rounded-md"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            inputMode={inputMode}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        )}
        <span className="w-20 shrink-0 text-sm text-slate">{unit}</span>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
