"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveQuote } from "@/lib/actions";
import { DEMO_CUSTOMER_NAMES } from "@/lib/db/seed";
import type { Configuration } from "@/lib/pricing/types";

function randomCustomerName(): string {
  const index = Math.floor(Math.random() * DEMO_CUSTOMER_NAMES.length);
  return DEMO_CUSTOMER_NAMES[index];
}

interface SaveQuoteDialogProps {
  configuration: Configuration;
  notes: string;
  /** Lets the desktop and mobile triggers keep their own button styling. */
  triggerClassName?: string;
}

/**
 * "Save quote" dialog, a bottom sheet below `lg`: a single "Customer name"
 * field prefilled with a fictional name, and, once saved, the "Quote
 * saved" confirmation offering to open the quote (`docs/design.md`,
 * "Configurator (desktop)"). Reused by `PriceSummary` and
 * `MobilePriceBar`, which supply the current configuration and notes.
 */
export function SaveQuoteDialog({
  configuration,
  notes,
  triggerClassName,
}: SaveQuoteDialogProps) {
  const customerNameId = useId();
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState(randomCustomerName);
  const [error, setError] = useState<string | null>(null);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
      setSavedNumber(null);
      setCustomerName(randomCustomerName());
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveQuote({
        customerName,
        notes: notes.trim() === "" ? undefined : notes,
        configuration,
      });
      if (result.success) {
        setSavedNumber(result.number);
      } else {
        setError(
          result.fieldErrors.customerName ??
            result.fieldErrors.root ??
            Object.values(result.fieldErrors)[0] ??
            "Could not save the quote.",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className={triggerClassName}>
          Save quote
        </Button>
      </DialogTrigger>
      <DialogContent>
        {savedNumber ? (
          <>
            <DialogHeader>
              <DialogTitle>Quote saved</DialogTitle>
              <DialogDescription>
                Quote {savedNumber} is ready.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button type="button" asChild className="rounded-md">
                <Link href={`/quotes/${savedNumber}`}>Open quote</Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Save quote</DialogTitle>
            </DialogHeader>
            <div className="grid gap-1.5 py-4">
              <Label htmlFor={customerNameId}>Customer name</Label>
              <Input
                id={customerNameId}
                className="rounded-md"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${customerNameId}-error` : undefined}
              />
              {error && (
                <p
                  id={`${customerNameId}-error`}
                  className="text-sm text-error"
                >
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-md" disabled={pending}>
                Save quote
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
