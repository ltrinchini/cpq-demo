import type { ReactNode } from "react";

/**
 * The fields of a settings category: one column on phones, three from `sm`
 * up, so every category shares the same column widths and a panel stays
 * filled without stretching short numeric inputs across it.
 */
export function SettingsFieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-3">{children}</div>;
}
