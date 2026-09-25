import Decimal from "decimal.js";
import { COST_LINES, type CostLine } from "@/lib/pricing/types";

/**
 * Width of each cost line's segment in the price breakdown bar, as a
 * percentage of the total. All zero when the total is zero (every cost set
 * to 0), which would otherwise divide by zero.
 */
export function breakdownWidths(
  lines: Record<CostLine, Decimal>,
  total: Decimal,
): Record<CostLine, Decimal> {
  const isZero = total.isZero();

  return Object.fromEntries(
    COST_LINES.map((line) => [
      line,
      isZero ? new Decimal(0) : lines[line].dividedBy(total).times(100),
    ]),
  ) as Record<CostLine, Decimal>;
}
