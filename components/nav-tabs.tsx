"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS, isNavTabActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex w-full divide-x divide-frost lg:w-auto lg:gap-6 lg:divide-x-0"
    >
      {NAV_TABS.map((tab) => {
        const active = isNavTabActive(tab.href, pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center rounded-md px-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-action lg:min-h-0 lg:flex-none lg:px-0",
              active ? "text-action" : "text-slate hover:text-ink",
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
