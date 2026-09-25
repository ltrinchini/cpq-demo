"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BAG_SIZE_LABELS,
  CURRENCY_LABELS,
  GRIND_LABELS,
  ORIGIN_LABELS,
  ROAST_PROFILE_LABELS,
} from "@/lib/labels";
import {
  BAG_SIZES,
  CURRENCIES,
  GRINDS,
  ORIGINS,
  ROAST_PROFILES,
  type Configuration,
} from "@/lib/pricing/types";
import { MAX_QUANTITY } from "@/lib/pricing/validation";

interface OptionsFormProps {
  configuration: Configuration;
  onConfigurationChange: (configuration: Configuration) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

/**
 * The configurator's options, in the order set by `docs/design.md`: coffee,
 * roast, grind, bag size, quantity, currency, notes.
 */
export function OptionsForm({
  configuration,
  onConfigurationChange,
  notes,
  onNotesChange,
}: OptionsFormProps) {
  function update<K extends keyof Configuration>(
    key: K,
    value: Configuration[K],
  ) {
    onConfigurationChange({ ...configuration, [key]: value });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <Label htmlFor="origin">Coffee</Label>
        <Select
          value={configuration.originId}
          onValueChange={(value) =>
            update("originId", value as Configuration["originId"])
          }
        >
          <SelectTrigger id="origin" className="w-full rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORIGINS.map((origin) => (
              <SelectItem key={origin} value={origin}>
                {ORIGIN_LABELS[origin]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Roast</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={configuration.roast}
          onValueChange={(value) => {
            if (value) update("roast", value as Configuration["roast"]);
          }}
          className="w-full"
        >
          {ROAST_PROFILES.map((profile) => (
            <ToggleGroupItem
              key={profile}
              value={profile}
              className="h-11 flex-1 rounded-md"
            >
              {ROAST_PROFILE_LABELS[profile]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-1.5">
        <Label>Grind</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={configuration.grind}
          onValueChange={(value) => {
            if (value) update("grind", value as Configuration["grind"]);
          }}
          className="w-full"
        >
          {GRINDS.map((grind) => (
            <ToggleGroupItem
              key={grind}
              value={grind}
              className="h-11 flex-1 rounded-md"
            >
              {GRIND_LABELS[grind]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-1.5">
        <Label>Bag size</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={configuration.bagSize}
          onValueChange={(value) => {
            if (value) update("bagSize", value as Configuration["bagSize"]);
          }}
          className="w-full"
        >
          {BAG_SIZES.map((bagSize) => (
            <ToggleGroupItem
              key={bagSize}
              value={bagSize}
              className="h-11 flex-1 rounded-md"
            >
              {BAG_SIZE_LABELS[bagSize]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="size-11 rounded-md text-lg"
            onClick={() =>
              update("quantity", Math.max(1, configuration.quantity - 1))
            }
            disabled={configuration.quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </Button>
          <Input
            id="quantity"
            className="h-11 rounded-md text-center"
            inputMode="numeric"
            value={configuration.quantity}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              if (!Number.isNaN(parsed)) {
                update("quantity", Math.min(Math.max(parsed, 1), MAX_QUANTITY));
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="size-11 rounded-md text-lg"
            onClick={() =>
              update(
                "quantity",
                Math.min(MAX_QUANTITY, configuration.quantity + 1),
              )
            }
            disabled={configuration.quantity >= MAX_QUANTITY}
            aria-label="Increase quantity"
          >
            +
          </Button>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={configuration.currency}
          onValueChange={(value) =>
            update("currency", value as Configuration["currency"])
          }
        >
          <SelectTrigger id="currency" className="w-full rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {CURRENCY_LABELS[currency]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          className="rounded-md"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Add a note for this quote (optional)"
        />
      </div>
    </div>
  );
}
