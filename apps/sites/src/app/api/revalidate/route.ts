import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

/**
 * Called by the backend right after a website's status/content changes, so a
 * suspended site disappears (and owner edits appear) on the very next visit
 * instead of after the 5-minute cache window.
 */
export async function POST(req: Request) {
  const expected = process.env.SITES_API_KEY || "";
  const given = req.headers.get("x-sites-key") || "";
  const ok = expected
    ? given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
    : process.env.NODE_ENV !== "production";
  if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { hosts?: unknown };
  const hosts = Array.isArray(body.hosts) ? body.hosts.filter((h): h is string => typeof h === "string" && h.length < 250).slice(0, 10) : [];
  for (const host of hosts) revalidateTag(`site:${host.toLowerCase()}`, { expire: 0 });
  return Response.json({ revalidated: hosts.length });
}
