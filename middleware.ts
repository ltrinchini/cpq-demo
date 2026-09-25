import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureVisitorCookie } from "@/lib/visitor";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  ensureVisitorCookie(request, response);
  return response;
}

export const config = {
  // Every page and Server Action, not static assets: a preview bot fetching
  // an image should not need a visitor ID.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
