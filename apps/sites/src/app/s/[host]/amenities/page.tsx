import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";
import { amenities, rupees } from "@/lib/format";

export const metadata: Metadata = { title: "Amenities & house rules" };

const GROUPS = ["Outdoor", "Stay", "Kitchen", "Fun", "Other"] as const;
const GROUP_TITLE: Record<(typeof GROUPS)[number], string> = {
  Outdoor: "Outdoor", Stay: "Rooms & comfort", Kitchen: "Kitchen", Fun: "Games & music", Other: "Good to know",
};

export default async function Amenities({ params }: { params: Promise<{ host: string }> }) {
  const site = await getSite(decodeURIComponent((await params).host));
  if (!site) notFound();
  const f = site.farmhouse;
  const all = amenities(f);
  // Same rule as the booking engine: `capacity` guests are included, `maxIncludedGuests` is the hard maximum.
  const included = f.capacity;

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-3xl font-bold">Amenities</h1>

      {GROUPS.map((g) => {
        const items = all.filter((a) => a.group === g);
        if (!items.length) return null;
        return (
          <div key={g}>
            <h2 className="text-lg font-semibold mb-3">{GROUP_TITLE[g]}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((a) => (
                <div key={a.label} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                  <span className="text-xl">{a.icon}</span><span>{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl bg-soft border border-line p-5 space-y-2 text-sm">
        <h2 className="text-lg font-semibold mb-1">Prices & guests</h2>
        <p>Day stay (12 hours): <b>{rupees(f.price12Hours)}</b></p>
        <p>Full day (24 hours): <b>{rupees(f.price24Hours)}</b></p>
        <p>Price includes up to <b>{included} guests</b>{f.maxIncludedGuests && f.maxIncludedGuests > f.capacity ? `, maximum ${f.maxIncludedGuests}` : ""}.</p>
        {!!f.extraGuestFee && <p>Extra guest: <b>{rupees(f.extraGuestFee)}</b> per person.</p>}
        <p className="text-ink-muted">Weekend and festival prices can differ. The owner confirms the final price before booking.</p>
      </div>

      <Link href="/book" className="h-12 rounded-full bg-brand text-white font-semibold flex items-center justify-center">Check availability</Link>
    </section>
  );
}
