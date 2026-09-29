"use client";

import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPercent, fromPercentInput, toPercentInput } from "@/lib/format";
import { ORIGIN_LABELS } from "@/lib/labels";
import { ORIGINS, type BlendOrigin, type OriginId } from "@/lib/pricing/types";
import { MAX_BLEND_ORIGINS } from "@/lib/pricing/validation";

/**
 * Recomputes the last origin's percentage as the remainder to 100%, so it
 * never needs its own input (`specs/009-blends/tasks.md`).
 */
function withComputedRemainder(origins: BlendOrigin[]): BlendOrigin[] {
  if (origins.length < 2)
    return origins.map((origin) => ({ ...origin, percentage: 1 }));

  const others = origins.slice(0, -1);
  const sum = others.reduce(
    (total, origin) => total.plus(origin.percentage),
    new Decimal(0),
  );
  const remainder = new Decimal(1).minus(sum);

  return [
    ...others,
    { ...origins[origins.length - 1], percentage: remainder.toNumber() },
  ];
}

interface BlendOriginsFieldProps {
  origins: BlendOrigin[];
  onChange: (origins: BlendOrigin[]) => void;
}

/**
 * Up to `MAX_BLEND_ORIGINS` origins, entered directly in the configurator
 * (`specs/009-blends/spec.md`). A single origin shows no percentage; "+ Add
 * origin" reveals another row, each with its own percentage except the
 * last, which absorbs the remainder to 100%.
 */
export function BlendOriginsField({
  origins,
  onChange,
}: BlendOriginsFieldProps) {
  function setOriginId(index: number, originId: OriginId) {
    onChange(
      origins.map((origin, i) =>
        i === index ? { ...origin, originId } : origin,
      ),
    );
  }

  function setPercentage(index: number, raw: string) {
    if (raw.trim() === "") return;
    const fraction = Number(fromPercentInput(raw));
    if (!Number.isFinite(fraction)) return;

    onChange(
      withComputedRemainder(
        origins.map((origin, i) =>
          i === index ? { ...origin, percentage: fraction } : origin,
        ),
      ),
    );
  }

  function addOrigin() {
    const used = new Set(origins.map((origin) => origin.originId));
    const nextOriginId = ORIGINS.find((origin) => !used.has(origin));
    if (!nextOriginId) return;

    const last = origins[origins.length - 1];
    const halfLast = new Decimal(last.percentage).dividedBy(2).toNumber();

    onChange(
      withComputedRemainder([
        ...origins.slice(0, -1),
        { ...last, percentage: halfLast },
        { originId: nextOriginId, percentage: halfLast },
      ]),
    );
  }

  function removeOrigin(index: number) {
    onChange(withComputedRemainder(origins.filter((_, i) => i !== index)));
  }

  return (
    <div className="grid gap-2">
      {origins.map((origin, index) => {
        const isLast = index === origins.length - 1;
        const otherOrigins = new Set(
          origins.filter((_, i) => i !== index).map((o) => o.originId),
        );

        return (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={origin.originId}
              onValueChange={(value) => setOriginId(index, value as OriginId)}
            >
              <SelectTrigger
                aria-label={`Origin ${index + 1}`}
                className="w-full rounded-md"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORIGINS.filter((o) => !otherOrigins.has(o)).map((o) => (
                  <SelectItem key={o} value={o}>
                    {ORIGIN_LABELS[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {origins.length > 1 && isLast && (
              <span className="w-16 shrink-0 text-right text-sm text-slate tabular-nums">
                {formatPercent(String(origin.percentage))}
              </span>
            )}
            {!isLast && (
              <Input
                aria-label={`${ORIGIN_LABELS[origin.originId]} percentage`}
                className="w-16 shrink-0 rounded-md text-right"
                inputMode="decimal"
                value={toPercentInput(String(origin.percentage))}
                onChange={(event) => setPercentage(index, event.target.value)}
              />
            )}
            {index > 0 && (
              <Button
                type="button"
                variant="outline"
                className="size-11 shrink-0 rounded-md text-lg"
                onClick={() => removeOrigin(index)}
                aria-label={`Remove ${ORIGIN_LABELS[origin.originId]}`}
              >
                ×
              </Button>
            )}
          </div>
        );
      })}

      {origins.length < MAX_BLEND_ORIGINS && (
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          onClick={addOrigin}
        >
          + Add origin
        </Button>
      )}
    </div>
  );
}
