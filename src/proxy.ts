import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NextAuth v5 session cookie. The `__Secure-` prefix is used when cookies are
// served over HTTPS (production); the bare name is used in local dev over HTTP.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

// Optimistic auth gate: redirects unauthenticated page requests to /login
// before any RSC rendering happens. This only checks for the *presence* of a
// session cookie (no DB lookup), so it stays runtime-safe and cheap. The
// authoritative, DB-validated check still runs in src/app/(app)/layout.tsx.
//
// API routes are intentionally excluded (see matcher) so they enforce their
// own auth and return JSON 401/403 instead of an HTML redirect.
// Public marketing routes that must stay reachable without a session.
const PUBLIC_PATHS = ["/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public landing page, plus any static asset served from /public (logo,
  // speech-bubble images, etc.). Static files always carry a file extension;
  // page routes in this app never do, so this can't leak a gated page.
  if (PUBLIC_PATHS.includes(pathname) || /\.[a-zA-Z0-9]+$/.test(pathname)) {
    return;
  }

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    // Run on every page route except: API routes (they self-enforce and return
    // JSON), Next internals/static assets, metadata files, and /login itself
    // (excluding /login avoids a redirect loop for unauthenticated users).
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login).*)",
  ],
};
