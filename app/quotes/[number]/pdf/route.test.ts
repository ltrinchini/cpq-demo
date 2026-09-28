import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQuote,
  getQuoteByNumber,
  updateSettings,
} from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { defaultConfiguration, defaultSettings } from "@/lib/db/seed";
import * as quoteDocumentModule from "@/lib/pdf/quote-document";
import { visitors } from "@/lib/db/schema";
import { VISITOR_COOKIE_NAME } from "@/lib/visitor";
import { GET } from "./route";

// Integration tests: require a reachable DATABASE_URL with migrations
// applied (`npm run db:migrate`).

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/pdf/quote-document", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/pdf/quote-document")>();
  return { ...actual, QuoteDocument: vi.fn(actual.QuoteDocument) };
});

async function mockVisitorCookie(visitorId: string | undefined): Promise<void> {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      visitorId !== undefined && name === VISITOR_COOKIE_NAME
        ? { name, value: visitorId }
        : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

beforeEach(async () => {
  await db.delete(visitors);
});

describe("GET /quotes/[number]/pdf", () => {
  it("streams the quote's PDF, named for the browser's viewer", async () => {
    const visitorId = randomUUID();
    const saved = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });
    await mockVisitorCookie(visitorId);

    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ number: saved.number }),
    });
    const buffer = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      `inline; filename="quote-${saved.number}.pdf"`,
    );
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("returns 404 for a number that doesn't exist", async () => {
    await mockVisitorCookie(randomUUID());

    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ number: "Q-260305-0001" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 for another visitor's quote", async () => {
    const ownerId = randomUUID();
    const saved = await createQuote(ownerId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });
    await mockVisitorCookie(randomUUID());

    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ number: saved.number }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when the visitor cookie is missing", async () => {
    await mockVisitorCookie(undefined);

    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ number: "Q-260305-0001" }),
    });

    expect(response.status).toBe(404);
  });

  it("renders the PDF from the quote's frozen amounts, unaffected by a later settings change", async () => {
    const visitorId = randomUUID();
    const configuration = defaultConfiguration();
    const saved = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration,
    });
    const frozenQuote = await getQuoteByNumber(visitorId, saved.number);

    await updateSettings(visitorId, {
      ...defaultSettings(),
      marginRate: defaultSettings().marginRate.plus("0.5"),
    });
    await mockVisitorCookie(visitorId);

    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ number: saved.number }),
    });

    expect(response.status).toBe(200);
    const mockedQuoteDocument = vi.mocked(quoteDocumentModule.QuoteDocument);
    const renderedQuote = mockedQuoteDocument.mock.calls.at(-1)?.[0].quote;
    expect(renderedQuote?.resultSnapshot).toEqual(frozenQuote?.resultSnapshot);
  });
});
