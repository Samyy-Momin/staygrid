"use client";

import { X } from "lucide-react";

export const SITES_ROOT = process.env.NEXT_PUBLIC_SITES_ROOT_DOMAIN || "staygrid.local";

export type DueState = "UNPAID" | "OVERDUE" | "DUE_SOON" | "PAID";
export type WebsiteStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";

export function siteUrl(site: { subdomain: string; customDomain?: string | null }) {
  return site.customDomain ? `https://${site.customDomain}` : `https://${site.subdomain}.${SITES_ROOT}`;
}

export function formatDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export const rupees = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_STYLE: Record<WebsiteStatus, string> = {
  ACTIVE: "bg-success/15 text-success",
  DRAFT: "bg-black/5 dark:bg-white/10 text-muted",
  SUSPENDED: "bg-danger/15 text-danger",
};
const STATUS_LABEL: Record<WebsiteStatus, string> = { ACTIVE: "Live", DRAFT: "Not live", SUSPENDED: "Shut down" };

const DUE_STYLE: Record<DueState, string> = {
  PAID: "bg-success/15 text-success",
  DUE_SOON: "bg-warning/20 text-warning",
  OVERDUE: "bg-danger/15 text-danger",
  UNPAID: "bg-danger/15 text-danger",
};
const DUE_LABEL: Record<DueState, string> = { PAID: "Paid", DUE_SOON: "Due soon", OVERDUE: "Overdue", UNPAID: "Not paid" };

export function StatusBadge({ status }: { status: WebsiteStatus }) {
  return <span className={`px-2.5 py-1 rounded-full text-caption font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function DueBadge({ state }: { state: DueState }) {
  return <span className={`px-2.5 py-1 rounded-full text-caption font-semibold ${DUE_STYLE[state]}`}>{DUE_LABEL[state]}</span>;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  // Bottom sheet on phones, centred dialog on desktop.
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <button aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-modal p-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3 font-semibold">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const fieldClass =
  "w-full h-12 px-3 rounded-lg border border-border bg-surface text-body outline-none focus:ring-2 focus:ring-accent-primary/40";

export function errorMessage(e: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = (e as any)?.response?.data?.message ?? (e as any)?.message ?? "Something went wrong";
  return Array.isArray(m) ? m.join(", ") : String(m);
}
