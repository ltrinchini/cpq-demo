export interface NavTab {
  href: string;
  label: string;
  mobileLabel: string;
}

export const NAV_TABS: readonly NavTab[] = [
  { href: "/", label: "Configure", mobileLabel: "Configure" },
  { href: "/quotes", label: "Quotes", mobileLabel: "Quotes" },
  { href: "/settings", label: "Pricing settings", mobileLabel: "Settings" },
];

export function isNavTabActive(tabHref: string, pathname: string): boolean {
  if (tabHref === "/") return pathname === "/";
  return pathname === tabHref || pathname.startsWith(`${tabHref}/`);
}
