// Server-side only (used from server components / server actions); never import from a client component.
const API = process.env.API_URL || "http://localhost:3000/api";

export function apiHeaders(): HeadersInit {
  const key = process.env.SITES_API_KEY;
  return key ? { "x-sites-key": key, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export type Review = { id: string; rating: number; comment: string | null; groupType: string | null; createdAt: string; user: { name: string } };

export type Farmhouse = {
  id: string; title: string; photos: string[]; price12Hours: number; price24Hours: number;
  weekendPrice12Hours: number | null; weekendPrice24Hours: number | null;
  capacity: number; maxIncludedGuests: number | null; extraGuestFee: number | null;
  isCoupleFriendly: boolean; isPetFriendly: boolean; isWheelchairAccessible: boolean;
  streetAddress: string | null; city: string | null; state: string | null; postalCode: string | null;
  latitude: number | null; longitude: number | null; contactNumbers: string[];
  hasPool: boolean; poolType: string | null; poolSize: string | null; hasTurf: boolean; hasRainDance: boolean;
  hasPlayArea: boolean; hasGardenArea: boolean; hasGazebo: boolean; hasCelebrationArea: boolean;
  roomCount: number; acRoomCount: number; nonAcRoomCount: number; hallCount: number;
  singleBedCount: number; doubleBedCount: number;
  hasKitchen: boolean; hasFridge: boolean; hasRoWater: boolean; hasBbq: boolean; hasGas: boolean;
  hasCarom: boolean; hasChess: boolean; has8BallPool: boolean; hasCricket: boolean; hasBadminton: boolean;
  hasTv: boolean; hasSpeakers: boolean; hasMicrophone: boolean; hasWifi: boolean;
  customAmenities: string[]; hostName: string | null; avgRating: number; reviewCount: number;
  reviews: Review[];
};

export type Site = {
  id: string; subdomain: string; customDomain: string | null;
  tagline: string | null; about: string | null; usps: string[]; whatsappNumber: string | null;
  farmhouse: Farmhouse;
};

/** Cached per host for 5 minutes: each live site costs the API at most ~1 call / 5 min. */
export async function getSite(host: string): Promise<Site | null> {
  const res = await fetch(`${API}/public/sites/resolve?host=${encodeURIComponent(host)}`, {
    headers: apiHeaders(),
    next: { revalidate: 300, tags: [`site:${host}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Site lookup failed (${res.status})`);
  return res.json();
}

export function enquiryUrl(subdomain: string) {
  return `${API}/public/sites/${encodeURIComponent(subdomain)}/enquiries`;
}
