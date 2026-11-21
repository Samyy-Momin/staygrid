"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/components/website-ui";

type Enquiry = {
  id: string; name: string; phone: string; checkIn: string | null; guests: number | null; message: string | null;
  status: "NEW" | "CONTACTED" | "BOOKED" | "LOST"; createdAt: string; farmhouse: { id: string; title: string };
};

const TABS = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Called" },
  { key: "BOOKED", label: "Booked" },
  { key: "LOST", label: "Not interested" },
] as const;

export default function EnquiriesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Enquiry["status"]>("NEW");
  const { data: all = [], isLoading } = useQuery<Enquiry[]>({
    queryKey: ["enquiries"],
    queryFn: async () => (await api.get("/websites/enquiries")).data,
    refetchInterval: 60_000,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Enquiry["status"] }) => api.patch(`/websites/enquiries/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enquiries"] }),
  });

  const list = all.filter((e) => e.status === tab);
  const count = (k: Enquiry["status"]) => all.filter((e) => e.status === k).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-h2 font-bold">Booking requests</h1>
        <p className="text-muted text-body-sm">People who asked to book from your website. Call them quickly!</p>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-11 rounded-lg text-caption sm:text-body-sm font-semibold ${tab === t.key ? "bg-surface shadow-card-rest text-primary" : "text-muted"}`}
          >
            {t.label} {count(t.key) > 0 && <span className={t.key === "NEW" ? "text-danger" : ""}>({count(t.key)})</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted p-6">Loading...</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">No requests here.</div>
      ) : (
        list.map((e) => {
          const wa = `https://wa.me/91${e.phone}?text=${encodeURIComponent(`Hello ${e.name}, this is ${e.farmhouse.title}. Thank you for your booking request.`)}`;
          return (
            <div key={e.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body font-semibold">{e.name}</p>
                  <p className="text-body-sm text-muted">{e.phone}</p>
                </div>
                <p className="text-caption text-muted shrink-0">{formatDate(e.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm">
                <span>📅 {e.checkIn ? formatDate(e.checkIn) : "Date not given"}</span>
                {e.guests && <span>👥 {e.guests} guests</span>}
                <span className="text-muted truncate">🏡 {e.farmhouse.title}</span>
              </div>
              {e.message && <p className="text-body-sm bg-black/5 dark:bg-white/5 rounded-lg p-3">{e.message}</p>}

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:+91${e.phone}`}
                  onClick={() => e.status === "NEW" && setStatus.mutate({ id: e.id, status: "CONTACTED" })}
                  className="h-12 rounded-lg bg-success text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Phone className="h-5 w-5" />Call
                </a>
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => e.status === "NEW" && setStatus.mutate({ id: e.id, status: "CONTACTED" })}
                  className="h-12 rounded-lg border border-border font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />WhatsApp
                </a>
              </div>
              <div className="flex gap-2">
                {e.status !== "BOOKED" && (
                  <button onClick={() => setStatus.mutate({ id: e.id, status: "BOOKED" })} className="flex-1 h-10 rounded-lg border border-success text-success text-body-sm font-semibold">
                    Mark booked
                  </button>
                )}
                {e.status !== "LOST" && (
                  <button onClick={() => setStatus.mutate({ id: e.id, status: "LOST" })} className="flex-1 h-10 rounded-lg border border-border text-muted text-body-sm font-semibold">
                    Not interested
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
