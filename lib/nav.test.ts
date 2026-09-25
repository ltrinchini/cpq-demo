import { describe, expect, it } from "vitest";
import { NAV_TABS, isNavTabActive } from "./nav";

describe("NAV_TABS", () => {
  it("lists Configure, Quotes and Pricing settings with the design.md copy", () => {
    expect(NAV_TABS).toEqual([
      { href: "/", label: "Configure", mobileLabel: "Configure" },
      { href: "/quotes", label: "Quotes", mobileLabel: "Quotes" },
      {
        href: "/settings",
        label: "Pricing settings",
        mobileLabel: "Settings",
      },
    ]);
  });
});

describe("isNavTabActive", () => {
  it("matches the root tab only on the exact root path", () => {
    expect(isNavTabActive("/", "/")).toBe(true);
    expect(isNavTabActive("/", "/settings")).toBe(false);
  });

  it("matches a tab on its exact path", () => {
    expect(isNavTabActive("/settings", "/settings")).toBe(true);
  });

  it("matches a tab on a nested route", () => {
    expect(isNavTabActive("/settings", "/settings/currencies")).toBe(true);
  });

  it("does not match a different tab", () => {
    expect(isNavTabActive("/quotes", "/settings")).toBe(false);
  });
});
