import mixpanel from "mixpanel-browser";

export const MIXPANEL_PROJECT_TOKEN =
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || "3067dc2baace22f6e66a822c0ff43f58";

let isInitialized = false;

export function initMixpanel() {
  if (typeof window === "undefined") return;
  if (isInitialized) return;

  try {
    mixpanel.init(MIXPANEL_PROJECT_TOKEN, {
      debug: process.env.NODE_ENV !== "production",
      track_pageview: true,
      persistence: "localStorage",
      ignore_dnt: true,
    });
    isInitialized = true;
  } catch (err) {
    console.warn("[Mixpanel] Init error:", err);
  }
}

export function identifyUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}) {
  if (typeof window === "undefined" || !user?.id) return;
  initMixpanel();

  try {
    mixpanel.identify(user.id);
    const peopleProps: Record<string, any> = {
      $name: user.name || "User",
      $email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role || "UNKNOWN",
      platform: "web",
    };
    mixpanel.people.set(peopleProps);
    mixpanel.register({
      user_role: user.role || "UNKNOWN",
      platform: "web",
    });
  } catch (err) {
    console.warn("[Mixpanel] Identify error:", err);
  }
}

export function resetMixpanel() {
  if (typeof window === "undefined") return;
  try {
    mixpanel.reset();
  } catch (err) {
    console.warn("[Mixpanel] Reset error:", err);
  }
}

export function trackEvent(event: string, properties: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  initMixpanel();

  try {
    mixpanel.track(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[Mixpanel] Track error for "${event}":`, err);
  }
}

export default mixpanel;
