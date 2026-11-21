import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";
import { contact, img } from "@/lib/format";

// Cache each site's pages; rebuild in the background at most every 5 minutes.
export const revalidate = 300;
export async function generateStaticParams() {
  return []; // build pages on first visit, then serve from cache (ISR)
}

type Props = { children: React.ReactNode; params: Promise<{ host: string }> };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const host = decodeURIComponent((await params).host);
  const site = await getSite(host);
  if (!site) return { title: "Not available", robots: { index: false } };
  const f = site.farmhouse;
  const description = site.tagline || `${f.title}${f.city ? ` in ${f.city}` : ""} — private farmhouse for up to ${f.maxIncludedGuests || f.capacity} guests. Book directly.`;
  const photo = f.photos[0] ? img(f.photos[0], 1200) : undefined;
  return {
    title: { default: `${f.title}${f.city ? ` · ${f.city}` : ""}`, template: `%s · ${f.title}` },
    description,
    metadataBase: new URL(`https://${host}`),
    alternates: { canonical: "/" },
    openGraph: { title: f.title, description, images: photo ? [photo] : undefined, type: "website" },
  };
}

export default async function SiteLayout({ children, params }: Props) {
  const host = decodeURIComponent((await params).host);
  const site = await getSite(host);
  if (!site) notFound();
  const c = contact(site);
  const nav = [
    { href: "/", label: "Home" },
    { href: "/photos", label: "Photos" },
    { href: "/amenities", label: "Amenities" },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto h-14 px-4 flex items-center gap-4">
          <Link href="/" className="font-bold text-lg truncate flex-1">{site.farmhouse.title}</Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-ink-muted">
            {nav.map((n) => <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>)}
          </nav>
          <Link href="/book" className="hidden sm:inline-flex h-10 px-5 items-center rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark">
            Book now
          </Link>
          <nav className="sm:hidden flex gap-4 text-sm text-ink-muted">
            {nav.slice(1).map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-24 sm:pb-0">{children}</main>

      <footer className="border-t border-line bg-soft">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-ink-muted flex flex-col sm:flex-row gap-2 sm:justify-between">
          <p>© {new Date().getFullYear()} {site.farmhouse.title}</p>
          {c.phone && <a href={c.tel!} className="hover:text-ink">Call +91 {c.phone}</a>}
        </div>
      </footer>

      {/* Sticky action bar on phones: the three things guests actually want */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-3 gap-2">
        {c.tel ? (
          <a href={c.tel} className="h-12 rounded-xl border border-line font-semibold flex items-center justify-center">📞 Call</a>
        ) : <span />}
        {c.whatsapp ? (
          <a href={c.whatsapp} target="_blank" rel="noreferrer" className="h-12 rounded-xl bg-whatsapp text-white font-semibold flex items-center justify-center">WhatsApp</a>
        ) : <span />}
        <Link href="/book" className="h-12 rounded-xl bg-brand text-white font-semibold flex items-center justify-center">Book</Link>
      </div>
    </div>
  );
}
