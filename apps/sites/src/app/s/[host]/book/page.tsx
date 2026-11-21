import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";
import { address, contact, img, mapsUrl, rupees } from "@/lib/format";
import { BookForm } from "./book-form";

export const metadata: Metadata = { title: "Book now" };

export default async function Book({ params }: { params: Promise<{ host: string }> }) {
  const site = await getSite(decodeURIComponent((await params).host));
  if (!site) notFound();
  const f = site.farmhouse;
  const c = contact(site);
  const map = mapsUrl(f);

  return (
    <section className="max-w-5xl mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold">Book {f.title}</h1>
          <p className="text-ink-muted mt-1">Send your dates — the owner calls you back to confirm.</p>
        </div>
        <BookForm subdomain={site.subdomain} maxGuests={f.maxIncludedGuests || f.capacity} />
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-line overflow-hidden">
          {f.photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img(f.photos[0], 760)} alt={f.title} className="w-full h-44 object-cover" />
          )}
          <div className="p-5 space-y-1 text-sm">
            <p className="font-semibold text-base">{f.title}</p>
            <p>12 hrs from <b>{rupees(f.price12Hours)}</b> · 24 hrs from <b>{rupees(f.price24Hours)}</b></p>
            <p className="text-ink-muted">Up to {f.maxIncludedGuests || f.capacity} guests</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5 space-y-3">
          <p className="font-semibold">Prefer to talk?</p>
          {c.tel && <a href={c.tel} className="h-12 rounded-xl border border-line font-semibold flex items-center justify-center">📞 Call +91 {c.phone}</a>}
          {c.whatsapp && (
            <a href={c.whatsapp} target="_blank" rel="noreferrer" className="h-12 rounded-xl bg-whatsapp text-white font-semibold flex items-center justify-center">
              Chat on WhatsApp
            </a>
          )}
          {address(f) && <p className="text-sm text-ink-muted pt-1">📍 {address(f)}</p>}
          {map && <a href={map} target="_blank" rel="noreferrer" className="text-sm text-brand font-semibold">Get directions →</a>}
        </div>
      </aside>
    </section>
  );
}
