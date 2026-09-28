const QUOTE_NUMBER_TIME_ZONE = "America/Toronto";

/**
 * `Q-YYMMDD-`: `date`'s calendar day in America/Toronto. Shared by
 * `nextQuoteNumber` and by the database query that counts a visitor's
 * quotes for the day (`number LIKE`), so both agree on what "today" means
 * without duplicating the time zone conversion.
 */
export function quoteNumberPrefix(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: QUOTE_NUMBER_TIME_ZONE,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") =>
    parts.find((p) => p.type === type)!.value;

  return `Q-${part("year")}${part("month")}${part("day")}-`;
}

/**
 * The next quote number for a visitor: `quotesTodayCount` is how many
 * quotes they already have for the calendar day of `date` in
 * America/Toronto, so their first quote of the day gets `0001`.
 */
export function nextQuoteNumber(date: Date, quotesTodayCount: number): string {
  return `${quoteNumberPrefix(date)}${String(quotesTodayCount + 1).padStart(4, "0")}`;
}
