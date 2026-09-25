import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

/** Holds the anonymous visitor's random ID (UUID). */
export const VISITOR_COOKIE_NAME = "cpq_visitor_id";

/**
 * One year: long enough that a returning visitor keeps their sandbox.
 * If the sandbox was purged for inactivity, the ID simply points to
 * nothing and the application falls back to the defaults.
 */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE_SECONDS,
};

/**
 * Reads the visitor ID in a Server Component, Server Action or Route
 * Handler. `undefined` before the cookie exists, which middleware sets
 * on every request, so this is mainly a safety fallback.
 */
export async function readVisitorId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(VISITOR_COOKIE_NAME)?.value;
}

/**
 * Ensures the request carries a visitor ID, generating one on the first
 * visit. Called from middleware: it is the only place a cookie can be
 * set on a plain page load, since Server Components cannot set cookies
 * during rendering. Setting the cookie never touches the database — the
 * sandbox itself is only created on the visitor's first write.
 */
export function ensureVisitorCookie(
  request: NextRequest,
  response: NextResponse,
): string {
  const existing = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  response.cookies.set(VISITOR_COOKIE_NAME, id, COOKIE_OPTIONS);
  return id;
}
