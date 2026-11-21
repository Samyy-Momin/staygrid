import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";
import { img } from "@/lib/format";

export const metadata: Metadata = { title: "Photos" };

export default async function Photos({ params }: { params: Promise<{ host: string }> }) {
  const site = await getSite(decodeURIComponent((await params).host));
  if (!site) notFound();
  const photos = site.farmhouse.photos;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Photos</h1>
      {photos.length === 0 ? (
        <p className="text-ink-muted">Photos coming soon.</p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [&>*]:mb-3">
          {photos.map((p, i) => (
            <a key={p} href={img(p, 2000)} target="_blank" rel="noreferrer" className="block break-inside-avoid rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(p, 800)} alt={`${site.farmhouse.title} photo ${i + 1}`} loading={i < 3 ? "eager" : "lazy"} className="w-full" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
