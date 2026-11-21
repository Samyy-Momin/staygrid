"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, ExternalLink, IndianRupee, Pencil, Plus, Power, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DueBadge, DueState, Sheet, StatusBadge, WebsiteStatus, errorMessage, fieldClass, formatDate, rupees, siteUrl,
} from "@/components/website-ui";

type Plan = { id: string; name: string; monthlyPrice: number; description?: string | null; isActive: boolean; _count?: { websites: number } };
type Site = {
  id: string; subdomain: string; customDomain: string | null; status: WebsiteStatus; suspendedReason: string | null;
  paidUntil: string | null; lastReminderAt: string | null; dueState: DueState; planId: string | null; plan: Plan | null;
  farmhouse: { id: string; title: string; city: string | null; owner: { id: string; name: string; phone: string | null } };
  _count: { enquiries: number };
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Live" },
  { key: "DRAFT", label: "Not live" },
  { key: "SUSPENDED", label: "Shut down" },
  { key: "DUE", label: "Payment due" },
] as const;

export default function WebsitesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");
  const [paying, setPaying] = useState<Site | null>(null);
  const [editing, setEditing] = useState<Site | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const { data: sites = [], isLoading } = useQuery<Site[]>({ queryKey: ["websites"], queryFn: async () => (await api.get("/websites")).data });
  const { data: plans = [] } = useQuery<Plan[]>({ queryKey: ["website-plans"], queryFn: async () => (await api.get("/websites/plans")).data });

  const refresh = (msg?: string) => {
    qc.invalidateQueries({ queryKey: ["websites"] });
    if (msg) setFlash(msg);
  };
  const onError = (e: unknown) => setFlash(errorMessage(e));

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) => api.patch(`/websites/${id}`, body),
    onSuccess: () => refresh("Saved"),
    onError,
  });
  const remind = useMutation({
    mutationFn: (id: string) => api.post(`/websites/${id}/remind`),
    onSuccess: (r) => refresh(r.data.alreadySentToday ? "Already reminded today" : "Reminder sent to owner"),
    onError,
  });
  const remindAll = useMutation({
    mutationFn: () => api.post("/websites/remind-due"),
    onSuccess: (r) => refresh(`Reminders sent: ${r.data.sent} of ${r.data.checked} due`),
    onError,
  });
  const generate = useMutation({
    mutationFn: () => api.post("/websites/generate-missing", {}),
    onSuccess: (r) => refresh(`${r.data.created} new websites created (not live yet)`),
    onError,
  });

  const stats = useMemo(() => {
    const live = sites.filter((s) => s.status === "ACTIVE");
    return {
      live: live.length,
      suspended: sites.filter((s) => s.status === "SUSPENDED").length,
      due: sites.filter((s) => s.status !== "DRAFT" && s.dueState !== "PAID").length,
      mrr: live.reduce((sum, s) => sum + (s.plan?.monthlyPrice || 0), 0),
    };
  }, [sites]);

  const visible = sites.filter((s) =>
    filter === "ALL" ? true : filter === "DUE" ? s.status !== "DRAFT" && s.dueState !== "PAID" : s.status === filter,
  );

  const toggleLive = (s: Site) => {
    if (s.status === "ACTIVE") {
      const reason = window.prompt(`Shut down ${s.farmhouse.title} website? Reason (owner will see this):`, "Payment pending");
      if (reason === null) return;
      update.mutate({ id: s.id, status: "SUSPENDED", suspendedReason: reason });
    } else {
      update.mutate({ id: s.id, status: "ACTIVE" });
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div>
          <h1 className="text-h2 font-bold">Owner Websites</h1>
          <p className="text-muted text-body-sm">Monthly website plans. Only live websites can be seen by the public.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowPlans(true)}>Plans</Button>
          <Button variant="outline" onClick={() => setShowBroadcast(true)}><Send className="h-4 w-4 mr-2" />Message owners</Button>
          <Button variant="outline" disabled={remindAll.isPending} onClick={() => remindAll.mutate()}>
            <BellRing className="h-4 w-4 mr-2" />Remind all due
          </Button>
          <Button disabled={generate.isPending} onClick={() => generate.mutate()}>
            <Sparkles className="h-4 w-4 mr-2" />Create for all farmhouses
          </Button>
        </div>
      </div>

      {flash && (
        <button onClick={() => setFlash(null)} className="w-full text-left px-4 py-3 rounded-lg bg-accent-primary/10 text-accent-primary text-body-sm font-medium">
          {flash}
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Live websites", value: stats.live },
          { label: "Monthly income", value: rupees(stats.mrr) },
          { label: "Payment due", value: stats.due, danger: stats.due > 0 },
          { label: "Shut down", value: stats.suspended },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border p-4">
            <p className="text-caption text-muted">{s.label}</p>
            <p className={`text-h2 font-bold ${s.danger ? "text-danger" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 h-9 rounded-full text-body-sm font-medium border ${
              filter === f.key ? "bg-accent-primary text-white border-accent-primary" : "border-border text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted p-6">Loading websites...</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          {sites.length === 0 ? "No websites yet. Tap “Create for all farmhouses” to start." : "Nothing here."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((s) => (
            <div key={s.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.farmhouse.title}</p>
                  <p className="text-caption text-muted truncate">
                    {s.farmhouse.owner.name}{s.farmhouse.owner.phone ? ` · ${s.farmhouse.owner.phone}` : ""}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <a href={siteUrl(s)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-body-sm text-accent-primary truncate">
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">{siteUrl(s).replace("https://", "")}</span>
              </a>

              <div className="flex flex-wrap items-center gap-2 text-body-sm">
                <DueBadge state={s.dueState} />
                <span className="text-muted">Paid till {formatDate(s.paidUntil)}</span>
                <span className="text-muted">· {s.plan ? `${s.plan.name} ${rupees(s.plan.monthlyPrice)}/mo` : "No plan"}</span>
                {s._count.enquiries > 0 && <span className="text-muted">· {s._count.enquiries} requests</span>}
              </div>
              {s.status === "SUSPENDED" && s.suspendedReason && <p className="text-caption text-danger">Reason: {s.suspendedReason}</p>}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button size="sm" onClick={() => setPaying(s)}><IndianRupee className="h-4 w-4 mr-1" />Payment</Button>
                <Button size="sm" variant="outline" disabled={remind.isPending} onClick={() => remind.mutate(s.id)}>
                  <BellRing className="h-4 w-4 mr-1" />Remind
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={s.status === "ACTIVE" ? "text-danger" : "text-success"}
                  onClick={() => toggleLive(s)}
                >
                  <Power className="h-4 w-4 mr-1" />{s.status === "ACTIVE" ? "Shut down" : "Go live"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {paying && <PaymentSheet site={paying} onClose={() => setPaying(null)} onDone={(m) => { setPaying(null); refresh(m); }} />}
      {editing && <EditSheet site={editing} plans={plans} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refresh("Saved"); }} />}
      {showPlans && <PlansSheet plans={plans} onClose={() => setShowPlans(false)} />}
      {showBroadcast && <BroadcastSheet onClose={() => setShowBroadcast(false)} onDone={(m) => { setShowBroadcast(false); setFlash(m); }} />}
    </div>
  );
}

function PaymentSheet({ site, onClose, onDone }: { site: Site; onClose: () => void; onDone: (msg: string) => void }) {
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(String(site.plan?.monthlyPrice ?? ""));
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [activate, setActivate] = useState(site.status !== "ACTIVE");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: () => api.post(`/websites/${site.id}/payments`, { amount: Number(amount), months, method, reference: reference || undefined, activate }),
    onSuccess: (r) => onDone(`Payment saved. Paid till ${formatDate(r.data.website.paidUntil)}`),
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <Sheet title={`Payment · ${site.farmhouse.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-body-sm font-medium mb-2">Months</p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => { setMonths(m); if (site.plan) setAmount(String(site.plan.monthlyPrice * m)); }}
                className={`h-12 rounded-lg border font-semibold ${months === m ? "bg-accent-primary text-white border-accent-primary" : "border-border"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-body-sm font-medium">Amount received (₹)</span>
          <input className={fieldClass} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </label>
        <div>
          <p className="text-body-sm font-medium mb-2">Paid by</p>
          <div className="grid grid-cols-3 gap-2">
            {["UPI", "CASH", "BANK"].map((m) => (
              <button key={m} onClick={() => setMethod(m)} className={`h-11 rounded-lg border text-body-sm font-semibold ${method === m ? "bg-accent-primary text-white border-accent-primary" : "border-border"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-body-sm font-medium">UTR / note (optional)</span>
          <input className={fieldClass} value={reference} onChange={(e) => setReference(e.target.value)} />
        </label>
        <label className="flex items-center gap-3 text-body-sm">
          <input type="checkbox" className="h-5 w-5" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
          Make website live
        </label>
        {error && <p className="text-danger text-body-sm">{error}</p>}
        <Button className="w-full h-12" disabled={!amount || save.isPending} onClick={() => save.mutate()}>
          Save payment
        </Button>
      </div>
    </Sheet>
  );
}

function EditSheet({ site, plans, onClose, onDone }: { site: Site; plans: Plan[]; onClose: () => void; onDone: () => void }) {
  const [subdomain, setSubdomain] = useState(site.subdomain);
  const [customDomain, setCustomDomain] = useState(site.customDomain || "");
  const [planId, setPlanId] = useState(site.planId || "");
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: () => api.patch(`/websites/${site.id}`, { subdomain, customDomain: customDomain.trim() || null, planId: planId || null }),
    onSuccess: onDone,
    onError: (e) => setError(errorMessage(e)),
  });
  return (
    <Sheet title="Website settings" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-body-sm font-medium">Website name (subdomain)</span>
          <input className={fieldClass} value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
          <span className="text-caption text-muted">{subdomain}.{process.env.NEXT_PUBLIC_SITES_ROOT_DOMAIN || "staygrid.local"}</span>
        </label>
        <label className="block">
          <span className="text-body-sm font-medium">Owner&apos;s own domain (optional)</span>
          <input className={fieldClass} placeholder="www.sharifafarmhouse.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())} />
          <span className="text-caption text-muted">Set only after the owner points the domain&apos;s DNS (CNAME) to our sites server.</span>
        </label>
        <label className="block">
          <span className="text-body-sm font-medium">Plan</span>
          <select className={fieldClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">No plan</option>
            {plans.filter((p) => p.isActive || p.id === site.planId).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {rupees(p.monthlyPrice)}/month</option>
            ))}
          </select>
        </label>
        {error && <p className="text-danger text-body-sm">{error}</p>}
        <Button className="w-full h-12" disabled={save.isPending} onClick={() => save.mutate()}>Save</Button>
      </div>
    </Sheet>
  );
}

function PlansSheet({ plans, onClose }: { plans: Plan[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const done = () => qc.invalidateQueries({ queryKey: ["website-plans"] });
  const create = useMutation({
    mutationFn: () => api.post("/websites/plans", { name: name.trim(), monthlyPrice: Number(price) }),
    onSuccess: () => { setName(""); setPrice(""); setError(""); done(); },
    onError: (e) => setError(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: (p: Plan) => api.patch(`/websites/plans/${p.id}`, { isActive: !p.isActive }),
    onSuccess: done,
  });
  return (
    <Sheet title="Website plans" onClose={onClose}>
      <div className="space-y-3">
        {plans.length === 0 && <p className="text-muted text-body-sm">No plans yet. Add your first one below.</p>}
        {plans.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-caption text-muted">{rupees(p.monthlyPrice)}/month · {p._count?.websites ?? 0} websites</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggle.mutate(p)}>{p.isActive ? "Hide" : "Show"}</Button>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_7rem] gap-2 pt-2">
          <input className={fieldClass} placeholder="Plan name e.g. Basic" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={fieldClass} placeholder="₹ / month" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
        {error && <p className="text-danger text-body-sm">{error}</p>}
        <Button className="w-full h-12" disabled={!name || !price || create.isPending} onClick={() => create.mutate()}>
          <Plus className="h-4 w-4 mr-2" />Add plan
        </Button>
      </div>
    </Sheet>
  );
}

function BroadcastSheet({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const send = useMutation({
    mutationFn: () => api.post("/notifications/send", { audience: "ALL_OWNERS", title, body }),
    onSuccess: (r) => onDone(`Message sent to ${r.data.sent} owners`),
    onError: (e) => setError(errorMessage(e)),
  });
  return (
    <Sheet title="Message all owners" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-caption text-muted">Shows in the owner app (push) and the owner panel bell.</p>
        <input className={fieldClass} maxLength={80} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${fieldClass} h-28 py-2`} maxLength={500} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
        {error && <p className="text-danger text-body-sm">{error}</p>}
        <Button className="w-full h-12" disabled={!title || !body || send.isPending} onClick={() => send.mutate()}>
          <Send className="h-4 w-4 mr-2" />Send
        </Button>
      </div>
    </Sheet>
  );
}
