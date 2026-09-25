"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { resetDemoData } from "@/lib/actions";

/**
 * "Reset demo data" (`docs/design.md`, "Settings"): sits apart from the
 * category panels, opens a confirmation (a bottom sheet below `lg`), and
 * restores every pricing setting to its demo default without touching
 * quotes.
 */
export function ResetDemoData() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await resetDemoData();
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-8 border-t border-frost pt-6">
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setError(null);
        }}
      >
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline">
            Reset demo data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data</AlertDialogTitle>
            <AlertDialogDescription>
              Every pricing setting goes back to its demo value. Saved quotes
              are not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-error">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={(event) => {
                  event.preventDefault();
                  handleConfirm();
                }}
              >
                Reset demo data
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
