import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";
import { address, amenities, contact, img, mapsUrl, rupees } from "@/lib/format";

export default async function Home({ params }: { params: Promise<{ host: string }> }) {
  const host = decodeURIComponent((await params).host);
  const site = await getSite(host);
  if (!site) notFound();
  const f = site.farmhouse;
  const c = contact(site);
  const top = amenities(f).slice(0, 8);
  const map = mapsUrl(f);
  const guests = f.maxIncludedGuests || f.capacity;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: f.title,
    description: site.tagline || site.about || undefined,
    image: f.photos.slice(0, 5).map((p) => img(p, 1200)),
    telephone: c.phone ? `+91${c.phone}` : undefined,
    priceRange: `${rupees(f.price12Hours)} - ${rupees(f.price24Hours)}`,
    address: { "@type": "PostalAddress", streetAddress: f.streetAddress || undefined, addressLocality: f.city || undefined, addressRegion: f.state || undefined, postalCode: f.postalCode || undefined, addressCountry: "IN" },
    geo: f.latitude && f.longitude ? { "@type": "GeoCoordinates", latitude: f.latitude, longitude: f.longitude } : undefined,
    aggregateRating: f.reviewCount > 0 ? { "@type": "AggregateRating", ratingValue: f.avgRating, reviewCount: f.reviewCount } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="relative h-[72dvh] min-h-[420px] max-h-[720px] bg-ink">
        {f.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(f.photos[0], 1600)} alt={f.title} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative h-full max-w-6xl mx-auto px-4 pb-10 flex flex-col justify-end text-white">
          {f.city && <p className="text-sm uppercase tracking-widest text-white/80">{f.city}</p>}
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mt-1">{f.title}</h1>
          {site.tagline && <p className="text-lg sm:text-xl text-white/90 mt-3 max-w-2xl">{site.tagline}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-white/90">
            {f.reviewCount > 0 && <span>★ {f.avgRating.toFixed(1)} ({f.reviewCount} reviews)</span>}
            <span>Up to {guests} guests</span>
            {f.roomCount > 0 && <span>{f.roomCount} rooms</span>}
          </div>
          <div className="hidden sm:flex gap-3 mt-6">
            <Link href="/book" className="h-12 px-7 rounded-full bg-white text-ink font-semibold flex items-center">Check availability</Link>
            {c.whatsapp && <a href={c.whatsapp} target="_blank" rel="noreferrer" className="h-12 px-7 rounded-full bg-whatsapp text-white font-semibold flex items-center">WhatsApp us</a>}
          </div>
        </div>
      </section>

      {/* Price strip */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-paper rounded-2xl shadow-xl border border-line grid grid-cols-2 sm:grid-cols-3 divide-x divide-line">
          <div className="p-4 sm:p-6">
            <p className="text-xs text-ink-muted">Day (12 hrs)</p>
            <p className="text-xl sm:text-2xl font-bold">{rupees(f.price12Hours)}</p>
          </div>
          <div className="p-4 sm:p-6">
            <p className="text-xs text-ink-muted">Full day (24 hrs)</p>
            <p className="text-xl sm:text-2xl font-bold">{rupees(f.price24Hours)}</p>
          </div>
          <div className="hidden sm:flex p-6 items-center justify-center">
            <Link href="/book" className="h-12 px-7 rounded-full bg-brand text-white font-semibold flex items-center hover:bg-brand-dark">Book now</Link>
          </div>
        </div>
        {(f.weekendPrice12Hours || f.weekendPrice24Hours) && (
          <p className="text-xs text-ink-muted mt-2 px-1">Weekend prices may be higher. Final price confirmed on call.</p>
        )}
      </section>

      {/* USPs */}
      {site.usps.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-12">
          <h2 className="text-2xl font-bold mb-4">Why guests love it</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {site.usps.map((u) => (
              <div key={u} className="rounded-2xl bg-soft border border-line p-5 font-medium">✓ {u}</div>
            ))}
          </div>
        </section>
      )}

      {/* Photo preview */}
      {f.photos.length > 1 && (
        <section className="max-w-6xl mx-auto px-4 mt-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold">Photos</h2>
            <Link href="/photos" className="text-brand font-semibold text-sm">See all {f.photos.length} →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96 rounded-2xl overflow-hidden">
            {f.photos.slice(1, 6).map((p, i) => (
              <Link key={p} href="/photos" className={i === 0 ? "col-span-2 row-span-2" : i > 2 ? "hidden sm:block" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(p, i === 0 ? 900 : 500)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {site.about && (
        <section className="max-w-3xl mx-auto px-4 mt-12">
          <h2 className="text-2xl font-bold mb-3">About the place</h2>
          <p className="text-ink-muted leading-relaxed whitespace-pre-line">{site.about}</p>
        </section>
      )}

      {/* Amenities preview */}
      {top.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold">What&apos;s included</h2>
            <Link href="/amenities" className="text-brand font-semibold text-sm">All amenities →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {top.map((a) => (
              <div key={a.label} className="rounded-xl border border-line p-4 flex items-center gap-3">
                <span className="text-2xl">{a.icon}</span><span className="text-sm font-medium">{a.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {f.reviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-12">
          <h2 className="text-2xl font-bold mb-4">Guest reviews</h2>
          <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4">
            {f.reviews.map((r) => (
              <div key={r.id} className="snap-start shrink-0 w-72 rounded-2xl border border-line p-5">
                <p className="text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                {r.comment && <p className="text-sm mt-2 line-clamp-4">{r.comment}</p>}
                <p className="text-xs text-ink-muted mt-3">{r.user.name}{r.groupType ? ` · ${r.groupType}` : ""}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location + final CTA */}
      <section className="max-w-6xl mx-auto px-4 my-12">
        <div className="rounded-3xl bg-brand text-white p-6 sm:p-10 grid gap-6 sm:grid-cols-[1fr_auto] items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Plan your stay at {f.title}</h2>
            {address(f) && <p className="text-white/80 mt-2">📍 {address(f)}</p>}
            {map && <a href={map} target="_blank" rel="noreferrer" className="inline-block mt-2 underline text-white/90">Open in Google Maps</a>}
          </div>
          <Link href="/book" className="h-12 px-8 rounded-full bg-white text-ink font-semibold flex items-center justify-center">Book now</Link>
        </div>
      </section>
    </>
  );
}
