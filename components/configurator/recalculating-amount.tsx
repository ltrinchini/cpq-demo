import { cn } from "@/lib/utils";

interface RecalculatingAmountProps {
  value: string;
  className?: string;
}

/**
 * Brief, very light coffee green background when `value` changes
 * (`docs/design.md`, "Motion"): the `key` remounts the span on every new
 * formatted value, replaying the `starting:` flash, which then fades over
 * 600 ms. `motion-safe:` disables the whole effect under "reduce motion".
 */
export function RecalculatingAmount({
  value,
  className,
}: RecalculatingAmountProps) {
  return (
    <span
      key={value}
      className={cn(
        "motion-safe:transition-colors motion-safe:duration-600 motion-safe:starting:bg-action/10",
        className,
      )}
    >
      {value}
    </span>
  );
}
