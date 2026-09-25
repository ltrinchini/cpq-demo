import Link from "next/link";
import { NavTabs } from "@/components/nav-tabs";

export function SiteHeader() {
  return (
    <header className="border-b border-frost bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-6 lg:py-4">
        <Link
          href="/"
          className="w-fit rounded-md text-lg font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-action"
        >
          Lantern Roasters · CPQ
        </Link>
        <NavTabs />
      </div>
    </header>
  );
}
