import type { Farmhouse, Site } from "./site";

/** Ask Cloudinary for a resized, auto-format (WebP/AVIF) copy instead of the original upload. */
export function img(url: string, width: number) {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("/upload/f_auto")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  return url;
}

export const rupees = (n: number | null | undefined) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;

const digits = (p: string) => p.replace(/\D/g, "").slice(-10);

export function contact(site: Site) {
  const phone = site.farmhouse.contactNumbers.map(digits).find((p) => p.length === 10) || site.whatsappNumber || "";
  const wa = site.whatsappNumber || phone;
  const waText = encodeURIComponent(`Hi, I'd like to book ${site.farmhouse.title}. Is it available?`);
  return {
    phone,
    tel: phone ? `tel:+91${phone}` : null,
    whatsapp: wa ? `https://wa.me/91${digits(wa)}?text=${waText}` : null,
  };
}

export function address(f: Farmhouse) {
  return [f.streetAddress, f.city, f.state, f.postalCode].filter(Boolean).join(", ");
}

export function mapsUrl(f: Farmhouse) {
  if (f.latitude && f.longitude) return `https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`;
  const a = address(f);
  return a ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` : null;
}

type Amenity = { icon: string; label: string; group: "Outdoor" | "Stay" | "Kitchen" | "Fun" | "Other" };

export function amenities(f: Farmhouse): Amenity[] {
  const list: [boolean, string, string, Amenity["group"]][] = [
    [f.hasPool, "🏊", f.poolSize ? `Swimming pool (${f.poolSize} ft)` : "Swimming pool", "Outdoor"],
    [f.hasTurf, "⚽", "Turf", "Outdoor"],
    [f.hasRainDance, "🌧️", "Rain dance", "Outdoor"],
    [f.hasGardenArea, "🌳", "Garden / lawn", "Outdoor"],
    [f.hasGazebo, "⛱️", "Gazebo", "Outdoor"],
    [f.hasPlayArea, "🛝", "Kids play area", "Outdoor"],
    [f.hasCelebrationArea, "🎉", "Party / celebration area", "Outdoor"],
    [f.roomCount > 0, "🛏️", `${f.roomCount} room${f.roomCount > 1 ? "s" : ""}${f.acRoomCount ? ` (${f.acRoomCount} AC)` : ""}`, "Stay"],
    [f.hallCount > 0, "🛋️", `${f.hallCount} hall${f.hallCount > 1 ? "s" : ""}`, "Stay"],
    [f.hasWifi, "📶", "Wi-Fi", "Stay"],
    [f.hasTv, "📺", "TV", "Stay"],
    [f.hasKitchen, "🍳", "Kitchen", "Kitchen"],
    [f.hasFridge, "🧊", "Fridge", "Kitchen"],
    [f.hasRoWater, "💧", "RO drinking water", "Kitchen"],
    [f.hasBbq, "🔥", "Barbecue", "Kitchen"],
    [f.hasGas, "🔥", "Gas stove", "Kitchen"],
    [f.hasSpeakers, "🔊", "Music speakers", "Fun"],
    [f.hasMicrophone, "🎤", "Microphone", "Fun"],
    [f.hasCricket, "🏏", "Cricket", "Fun"],
    [f.hasBadminton, "🏸", "Badminton", "Fun"],
    [f.hasCarom, "🎯", "Carrom", "Fun"],
    [f.hasChess, "♟️", "Chess", "Fun"],
    [f.has8BallPool, "🎱", "Pool table", "Fun"],
    [f.isCoupleFriendly, "💑", "Couple friendly", "Other"],
    [f.isPetFriendly, "🐕", "Pets allowed", "Other"],
    [f.isWheelchairAccessible, "♿", "Wheelchair accessible", "Other"],
  ];
  return [
    ...list.filter(([on]) => on).map(([, icon, label, group]) => ({ icon, label, group })),
    ...f.customAmenities.filter(Boolean).map((label) => ({ icon: "✨", label, group: "Other" as const })),
  ];
}
