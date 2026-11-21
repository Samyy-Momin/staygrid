"use server";

import { apiHeaders, enquiryUrl } from "@/lib/site";

export type EnquiryState = { ok: boolean; message: string } | null;

export async function submitEnquiry(subdomain: string, _prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").replace(/[^\d+]/g, "");
  const date = String(formData.get("date") || "");
  const guests = Number(formData.get("guests") || 0);
  const message = String(formData.get("message") || "").trim();

  if (name.length < 2) return { ok: false, message: "Please enter your name" };
  if (!/^(\+?91)?[6-9]\d{9}$/.test(phone)) return { ok: false, message: "Please enter a valid 10-digit mobile number" };

  try {
    const res = await fetch(enquiryUrl(subdomain), {
      method: "POST",
      headers: apiHeaders(),
      cache: "no-store",
      body: JSON.stringify({
        name,
        phone,
        checkIn: /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T10:00:00+05:30`).toISOString() : undefined,
        guests: guests > 0 ? Math.min(guests, 500) : undefined,
        message: message || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = Array.isArray(data?.message) ? data.message[0] : data?.message;
      return { ok: false, message: m || "Could not send your request. Please call or WhatsApp instead." };
    }
    return { ok: true, message: data.message || "Request sent! The owner will call you shortly." };
  } catch {
    return { ok: false, message: "Could not send your request. Please call or WhatsApp instead." };
  }
}
