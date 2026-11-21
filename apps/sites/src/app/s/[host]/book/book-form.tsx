"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "./actions";

const field = "w-full h-12 px-4 rounded-xl border border-line bg-paper text-base outline-none focus:ring-2 focus:ring-brand/40";

export function BookForm({ subdomain, maxGuests }: { subdomain: string; maxGuests: number }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry.bind(null, subdomain), null);
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-brand/10 border border-brand/30 p-6 text-center space-y-2">
        <p className="text-4xl">✅</p>
        <p className="text-lg font-semibold">{state.message}</p>
        <p className="text-sm text-ink-muted">Keep your phone close — you&apos;ll get a call to confirm dates and price.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Your name</span>
        <input name="name" required minLength={2} maxLength={60} autoComplete="name" className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Mobile number</span>
        <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={13} className={field} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Date</span>
          <input name="date" type="date" min={today} className={field} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Guests</span>
          <input name="guests" type="number" min={1} max={Math.max(maxGuests, 1)} inputMode="numeric" className={field} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Message (optional)</span>
        <textarea name="message" maxLength={500} rows={3} placeholder="Birthday party, overnight stay, etc." className={`${field} h-auto py-3`} />
      </label>
      {state && !state.ok && <p className="text-red-600 text-sm">{state.message}</p>}
      <button disabled={pending} className="w-full h-14 rounded-xl bg-brand text-white text-lg font-semibold disabled:opacity-60 hover:bg-brand-dark">
        {pending ? "Sending..." : "Send booking request"}
      </button>
      <p className="text-xs text-ink-muted text-center">No payment now. The owner will call you to confirm.</p>
    </form>
  );
}
