export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ host: string }> }) {
  const host = decodeURIComponent((await params).host);
  const urls = ["", "/photos", "/amenities", "/book"]
    .map((p) => `<url><loc>https://${host}${p}</loc><changefreq>weekly</changefreq><priority>${p ? "0.7" : "1.0"}</priority></url>`)
    .join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml" },
  });
}
