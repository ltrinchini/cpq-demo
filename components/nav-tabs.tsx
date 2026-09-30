"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS, isNavTabActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Primary tabs as segmented buttons, styled like the configurator's (coffee
 * green border and tint on the active tab) at every width: full width in equal
 * parts below `lg`, compact on the right of the header from `lg` up
 * (`docs/design.md`, "Navigation").
 */
export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex w-full gap-2 lg:w-auto">
      {NAV_TABS.map((tab) => {
        const active = isNavTabActive(tab.href, pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center rounded-md border px-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-action lg:min-h-9 lg:flex-none lg:px-3",
              active
                ? "border-action bg-action/5 text-action"
                : "border-frost text-slate hover:text-ink",
            )}
          >
            <span className="lg:hidden">{tab.mobileLabel}</span>
            <span className="hidden lg:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
