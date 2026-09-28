import { describe, expect, it } from "vitest";
import { nextQuoteNumber, quoteNumberPrefix } from "./quote-number";

describe("quoteNumberPrefix", () => {
  it("matches the day code used by nextQuoteNumber", () => {
    const date = new Date("2026-03-05T12:00:00Z");

    expect(quoteNumberPrefix(date)).toBe("Q-260305-");
    expect(nextQuoteNumber(date, 0)).toBe(`${quoteNumberPrefix(date)}0001`);
  });
});

describe("nextQuoteNumber", () => {
  it("gives 0001 to a visitor's first quote of the day", () => {
    expect(nextQuoteNumber(new Date("2026-03-05T12:00:00Z"), 0)).toBe(
      "Q-260305-0001",
    );
  });

  it("increments the per-visitor counter and pads it to 4 digits", () => {
    const date = new Date("2026-03-05T12:00:00Z");

    expect(nextQuoteNumber(date, 1)).toBe("Q-260305-0002");
    expect(nextQuoteNumber(date, 22)).toBe("Q-260305-0023");
  });

  it("uses the America/Toronto calendar date, not the UTC one", () => {
    // 2026-03-05T04:30:00Z is still 2026-03-04 evening in Toronto (EST, UTC-5).
    expect(nextQuoteNumber(new Date("2026-03-05T04:30:00Z"), 0)).toBe(
      "Q-260304-0001",
    );
  });

  it("accounts for daylight saving time (EDT, UTC-4)", () => {
    // 2026-07-14T03:30:00Z is still 2026-07-13 evening in Toronto (EDT, UTC-4).
    expect(nextQuoteNumber(new Date("2026-07-14T03:30:00Z"), 0)).toBe(
      "Q-260713-0001",
    );
  });

  it("rolls the counter back to 0001 on a day change", () => {
    const lastOfDay = nextQuoteNumber(new Date("2026-03-05T12:00:00Z"), 3);
    const firstOfNextDay = nextQuoteNumber(new Date("2026-03-06T12:00:00Z"), 0);

    expect(lastOfDay).toBe("Q-260305-0004");
    expect(firstOfNextDay).toBe("Q-260306-0001");
  });

  it("carries a year change across the month and day", () => {
    // 2026-01-01T04:00:00Z is still 2025-12-31 evening in Toronto (EST, UTC-5).
    expect(nextQuoteNumber(new Date("2026-01-01T04:00:00Z"), 0)).toBe(
      "Q-251231-0001",
    );
  });
});
