export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ host: string }> }) {
  const host = decodeURIComponent((await params).host);
  return new Response(`User-agent: *\nAllow: /\nSitemap: https://${host}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain" } });
}
