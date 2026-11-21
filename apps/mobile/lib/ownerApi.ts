import { api } from "./authApi";

export type OwnerBooking = {
  id: string; checkIn: string; checkOut: string; adults: number; children: number; status: string;
  totalAmount: number; tokenPaid: number; paymentMethod: string | null;
  farmhouse: { id: string; title: string };
  user: { name: string; phone: string | null } | null;
};

export type Enquiry = {
  id: string; name: string; phone: string; checkIn: string | null; guests: number | null; message: string | null;
  status: "NEW" | "CONTACTED" | "BOOKED" | "LOST"; createdAt: string; farmhouse: { id: string; title: string };
};

export type AppNotification = { id: string; type: string; title: string; body: string; readAt: string | null; createdAt: string };

export type OwnerFarmhouse = { id: string; title: string; photos: string[] };

const list = <T,>(d: any): T[] => (Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);

export const ownerApi = {
  bookings: async () => list<OwnerBooking>((await api.get("/api/bookings")).data),
  enquiries: async () => list<Enquiry>((await api.get("/api/websites/enquiries")).data),
  setEnquiryStatus: (id: string, status: Enquiry["status"]) => api.patch(`/api/websites/enquiries/${id}`, { status }),
  notifications: async () => list<AppNotification>((await api.get("/api/notifications/me")).data),
  markAllRead: () => api.patch("/api/notifications/read-all"),
  farmhouses: async () => list<OwnerFarmhouse>((await api.get("/api/farmhouses?limit=50")).data),
  blockedDates: async (farmhouseId: string) =>
    list<{ id: string; startDate: string; endDate: string; note: string | null }>((await api.get(`/api/farmhouses/${farmhouseId}/blocked-dates`)).data),
  unblock: (blockedId: string) => api.delete(`/api/farmhouses/blocked-dates/${blockedId}`),
  blockDay: (farmhouseId: string, day: string, note?: string) => {
    // A whole India-time day: 00:00 IST to 00:00 IST next day.
    const start = new Date(`${day}T00:00:00+05:30`);
    const end = new Date(start.getTime() + 24 * 3600 * 1000);
    return api.post(`/api/farmhouses/${farmhouseId}/blocked-dates`, { startDate: start.toISOString(), endDate: end.toISOString(), note });
  },
};

/** Where a signed-in user should land. Owners get their own simple home. */
export const homeRouteFor = (user?: { role?: string } | null) =>
  String(user?.role || "").toUpperCase() === "OWNER" ? "/owner" : "/(tabs)/home";

export const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE || "";
export const OWNER_PANEL_URL = process.env.EXPO_PUBLIC_OWNER_PANEL_URL || "";

export const istDayKey = (d: Date | string) => new Date(new Date(d).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

export const formatWhen = (iso: string) =>
  // Device time (owners' phones are on IST). No timeZone option: safest across Hermes Intl builds.
  new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
