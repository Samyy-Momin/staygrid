"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Inbox, Phone, Share2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DueBadge, DueState, StatusBadge, WebsiteStatus, errorMessage, fieldClass, formatDate, rupees, siteUrl } from "@/components/website-ui";

type MySite = {
  id: string; subdomain: string; customDomain: string | null; status: WebsiteStatus; suspendedReason: string | null;
  tagline: string | null; about: string | null; usps: string[]; whatsappNumber: string | null;
  paidUntil: string | null; dueState: DueState; plan: { name: string; monthlyPrice: number } | null;
  farmhouse: { id: string; title: string; photos: string[] };
  _count: { enquiries: number };
};

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

export default function MyWebsitePage() {
  const { data: sites = [], isLoading } = useQuery<MySite[]>({ queryKey: ["my-websites"], queryFn: async () => (await api.get("/websites/mine")).data });

  if (isLoading) return <p className="text-muted p-6">Loading...</p>;
  if (sites.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center rounded-2xl border border-dashed border-border p-10 space-y-3">
        <p className="text-h3 font-semibold">You don&apos;t have a website yet</p>
        <p className="text-muted">Call StayGrid to get your own farmhouse website.</p>
        {SUPPORT_PHONE && (
          <a href={`tel:${SUPPORT_PHONE}`}><Button className="h-12 px-6"><Phone className="h-5 w-5 mr-2" />Call StayGrid</Button></a>
        )}
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {sites.map((s) => <SiteCard key={s.id} site={s} />)}
    </div>
  );
}

function SiteCard({ site }: { site: MySite }) {
  const qc = useQueryClient();
  const url = siteUrl(site);
  const [form, setForm] = useState({
    tagline: site.tagline || "",
    about: site.about || "",
    usps: site.usps.length ? site.usps : ["", "", ""],
    whatsappNumber: site.whatsappNumber || "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = useMutation({
    mutationFn: () => api.patch(`/websites/${site.id}/content`, { ...form, usps: form.usps.filter((u) => u.trim()) }),
    onSuccess: () => { setMsg({ ok: true, text: "Saved" }); qc.invalidateQueries({ queryKey: ["my-websites"] }); },
    onError: (e) => setMsg({ ok: false, text: errorMessage(e) }),
  });

  const share = async () => {
    const text = `${site.farmhouse.title} — book directly: ${url}`;
    if (navigator.share) await navigator.share({ title: site.farmhouse.title, url, text }).catch(() => null);
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="rounded-2xl border border-border overflow-hidden">
        {site.farmhouse.photos?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.farmhouse.photos[0]} alt="" className="w-full h-40 object-cover" />
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="flex-1 text-h3 font-bold truncate">{site.farmhouse.title}</h1>
            <StatusBadge status={site.status} />
          </div>

          {site.status === "ACTIVE" ? (
            <>
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-accent-primary font-medium break-all">
                <ExternalLink className="h-4 w-4 shrink-0" />{url.replace("https://", "")}
              </a>
              <div className="grid grid-cols-3 gap-2">
                <Button className="h-12" onClick={share}><Share2 className="h-5 w-5 mr-1" />Share</Button>
                <Button variant="outline" className="h-12" onClick={() => navigator.clipboard?.writeText(url).then(() => setMsg({ ok: true, text: "Link copied" }))}>
                  <Copy className="h-5 w-5 mr-1" />Copy
                </Button>
                <Link href="/enquiries" className="contents">
                  <Button variant="outline" className="h-12"><Inbox className="h-5 w-5 mr-1" />{site._count.enquiries || ""} New</Button>
                </Link>
              </div>
            </>
          ) : (
            <p className={`rounded-lg p-3 text-body-sm ${site.status === "SUSPENDED" ? "bg-danger/10 text-danger" : "bg-black/5 text-muted"}`}>
              {site.status === "SUSPENDED"
                ? `Your website is shut down. ${site.suspendedReason || ""} Please call StayGrid.`
                : "Your website is ready but not live yet. StayGrid will make it live."}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap text-body-sm">
            <DueBadge state={site.dueState} />
            <span className="text-muted">
              {site.plan ? `${rupees(site.plan.monthlyPrice)}/month · ` : ""}Paid till {formatDate(site.paidUntil)}
            </span>
          </div>
        </div>
      </div>

      {/* Content editor */}
      <div className="rounded-2xl border border-border p-4 space-y-4">
        <h2 className="text-h3 font-semibold">Website text</h2>
        <label className="block space-y-1">
          <span className="text-body-sm font-medium">Short line (shows at the top)</span>
          <input className={fieldClass} maxLength={120} placeholder="Private pool farmhouse near Bhiwandi" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </label>
        <div className="space-y-2">
          <span className="text-body-sm font-medium">Best things about your place</span>
          {form.usps.map((u, i) => (
            <input
              key={i}
              className={fieldClass}
              maxLength={80}
              placeholder={["Big private pool", "Lawn for 100 guests", "Free parking"][i] || "Another highlight"}
              value={u}
              onChange={(e) => setForm({ ...form, usps: form.usps.map((x, j) => (j === i ? e.target.value : x)) })}
            />
          ))}
          {form.usps.length < 8 && (
            <button className="text-accent-primary text-body-sm font-medium" onClick={() => setForm({ ...form, usps: [...form.usps, ""] })}>+ Add one more</button>
          )}
        </div>
        <label className="block space-y-1">
          <span className="text-body-sm font-medium">About your farmhouse</span>
          <textarea className={`${fieldClass} h-32 py-2`} maxLength={1500} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-body-sm font-medium">WhatsApp number for guests</span>
          <input className={fieldClass} inputMode="tel" maxLength={13} placeholder="98XXXXXXXX" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value.replace(/[^\d+]/g, "") })} />
        </label>
        {msg && <p className={`text-body-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
        <Button className="w-full h-12 text-body" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
