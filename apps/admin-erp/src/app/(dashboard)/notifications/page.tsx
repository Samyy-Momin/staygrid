"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

type Notification = { id: string; type: string; title: string; body: string; readAt: string | null; createdAt: string };

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hr ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const URGENT = new Set(["WEBSITE_PAYMENT_DUE", "WEBSITE_SUSPENDED", "WEBSITE_ENQUIRY"]);

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["my-notifications"],
    queryFn: async () => (await api.get("/notifications/me")).data,
  });
  const markAll = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications"] }),
  });

  // Opening this page counts as reading everything; the list keeps the unread highlight until next visit.
  const hasUnread = items.some((n) => !n.readAt);
  useEffect(() => {
    if (hasUnread && !markAll.isPending) markAll.mutate();
  }, [hasUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <h1 className="text-h2 font-bold">Notifications</h1>
      {isLoading ? (
        <p className="text-muted p-6">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          <Bell className="h-8 w-8 mx-auto mb-2" />No notifications yet.
        </div>
      ) : (
        items.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 ${URGENT.has(n.type) ? "border-warning/50 bg-warning/5" : "border-border"} ${!n.readAt ? "ring-1 ring-accent-primary/30" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{n.title}</p>
              <span className="text-caption text-muted shrink-0">{timeAgo(n.createdAt)}</span>
            </div>
            <p className="text-body-sm text-muted mt-1">{n.body}</p>
          </div>
        ))
      )}
    </div>
  );
}
