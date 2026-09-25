import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import {
  VISITOR_COOKIE_NAME,
  ensureVisitorCookie,
  readVisitorId,
} from "./visitor";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function requestWithCookie(value?: string): NextRequest {
  const headers = new Headers();
  if (value !== undefined) {
    headers.set("cookie", `${VISITOR_COOKIE_NAME}=${value}`);
  }
  return new NextRequest("http://localhost/", { headers });
}

describe("ensureVisitorCookie", () => {
  it("generates a UUID and sets it on the response when no cookie exists", () => {
    const response = NextResponse.next();

    const id = ensureVisitorCookie(requestWithCookie(), response);

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    const cookie = response.cookies.get(VISITOR_COOKIE_NAME);
    expect(cookie?.value).toBe(id);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.secure).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.path).toBe("/");
  });

  it("generates a different UUID on each call", () => {
    const first = ensureVisitorCookie(requestWithCookie(), NextResponse.next());
    const second = ensureVisitorCookie(
      requestWithCookie(),
      NextResponse.next(),
    );

    expect(first).not.toBe(second);
  });

  it("keeps the existing cookie and sets nothing on the response", () => {
    const existingId = "11111111-1111-1111-1111-111111111111";
    const response = NextResponse.next();

    const id = ensureVisitorCookie(requestWithCookie(existingId), response);

    expect(id).toBe(existingId);
    expect(response.cookies.get(VISITOR_COOKIE_NAME)).toBeUndefined();
  });
});

describe("readVisitorId", () => {
  it("returns the cookie value when present", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === VISITOR_COOKIE_NAME ? { name, value: "abc" } : undefined,
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    expect(await readVisitorId()).toBe("abc");
  });

  it("returns undefined when the cookie is absent", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    expect(await readVisitorId()).toBeUndefined();
  });
});
