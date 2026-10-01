import { NextResponse, type NextRequest } from "next/server";

import {
  STATIC_SECURITY_HEADERS,
  buildContentSecurityPolicy,
  createNonce,
} from "@/src/lib/server/http/securityHeaders.ts";

/**
 * Share-ready headers on every response, including /api/*.
 * A per-request nonce lets Next.js and the theme boot script run without
 * `script-src 'unsafe-inline'`. The layout reads it from `x-nonce`.
 */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    dev: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const [key, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
