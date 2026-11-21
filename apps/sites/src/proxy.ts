import { NextResponse, type NextRequest } from "next/server";

/**
 * Multi-tenant routing: every request is rewritten to /s/<host>/<path> so each
 * owner website is rendered (and cached) per host.
 *   sharifafarmhouse.staygridbhiwandi.com/photos  ->  /s/sharifafarmhouse.staygridbhiwandi.com/photos
 *   www.sharifafarmhouse.com/                     ->  /s/www.sharifafarmhouse.com
 * The backend decides which website (if any) a host belongs to.
 */
export function proxy(request: NextRequest) {
  let host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  if (process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1") && process.env.DEV_SITE_HOST) {
    host = process.env.DEV_SITE_HOST.toLowerCase();
  }
  const url = request.nextUrl.clone();
  url.pathname = `/s/${encodeURIComponent(host)}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
