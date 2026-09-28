const QUOTE_NUMBER_TIME_ZONE = "America/Toronto";

/**
 * `Q-YYMMDD-XXXX`: `date` formatted as a calendar day in America/Toronto,
 * and `counter` padded to 4 digits.
 */
function formatQuoteNumber(date: Date, counter: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: QUOTE_NUMBER_TIME_ZONE,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") =>
    parts.find((p) => p.type === type)!.value;

  return `Q-${part("year")}${part("month")}${part("day")}-${String(counter).padStart(4, "0")}`;
}

/**
 * The next quote number for a visitor: `quotesTodayCount` is how many
 * quotes they already have for the calendar day of `date` in
 * America/Toronto, so their first quote of the day gets `0001`.
 */
export function nextQuoteNumber(date: Date, quotesTodayCount: number): string {
  return formatQuoteNumber(date, quotesTodayCount + 1);
}
