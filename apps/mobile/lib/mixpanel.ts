import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const MIXPANEL_PROJECT_TOKEN =
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || "3067dc2baace22f6e66a822c0ff43f58";

const STORAGE_KEYS = {
  DISTINCT_ID: "@staygrid_mixpanel_distinct_id",
  ANON_ID: "@staygrid_mixpanel_anon_id",
  SUPER_PROPS: "@staygrid_mixpanel_super_props",
};

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class MixpanelService {
  private token: string = MIXPANEL_PROJECT_TOKEN;
  private distinctId: string = "";
  private superProperties: Record<string, any> = {};
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        let storedDistinctId = await AsyncStorage.getItem(STORAGE_KEYS.DISTINCT_ID);
        let storedAnonId = await AsyncStorage.getItem(STORAGE_KEYS.ANON_ID);

        if (!storedAnonId) {
          storedAnonId = `$device:${generateUUID()}`;
          await AsyncStorage.setItem(STORAGE_KEYS.ANON_ID, storedAnonId);
        }

        this.distinctId = storedDistinctId || storedAnonId;

        const storedProps = await AsyncStorage.getItem(STORAGE_KEYS.SUPER_PROPS);
        if (storedProps) {
          try {
            this.superProperties = JSON.parse(storedProps);
          } catch {
            this.superProperties = {};
          }
        }

        this.initialized = true;
      } catch (err) {
        console.warn("[Mixpanel] Init error:", err);
        if (!this.distinctId) {
          this.distinctId = `$device:${generateUUID()}`;
        }
        this.initialized = true;
      }
    })();

    return this.initPromise;
  }

  async identify(userId: string): Promise<void> {
    await this.init();
    if (!userId) return;

    this.distinctId = userId;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DISTINCT_ID, userId);
    } catch (e) {
      console.warn("[Mixpanel] Failed to persist distinct_id:", e);
    }
  }

  async reset(): Promise<void> {
    const newAnonId = `$device:${generateUUID()}`;
    this.distinctId = newAnonId;
    this.superProperties = {};

    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DISTINCT_ID);
      await AsyncStorage.setItem(STORAGE_KEYS.ANON_ID, newAnonId);
      await AsyncStorage.removeItem(STORAGE_KEYS.SUPER_PROPS);
    } catch (e) {
      console.warn("[Mixpanel] Reset storage error:", e);
    }
  }

  async registerSuperProperties(props: Record<string, any>): Promise<void> {
    await this.init();
    this.superProperties = { ...this.superProperties, ...props };
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SUPER_PROPS,
        JSON.stringify(this.superProperties)
      );
    } catch (e) {
      console.warn("[Mixpanel] Failed to save super properties:", e);
    }
  }

  async track(event: string, properties: Record<string, any> = {}): Promise<void> {
    try {
      await this.init();

      const payload = [
        {
          event,
          properties: {
            token: this.token,
            distinct_id: this.distinctId,
            time: Math.floor(Date.now() / 1000),
            $insert_id: generateUUID(),
            platform: "mobile",
            os: Platform.OS,
            ...this.superProperties,
            ...properties,
          },
        },
      ];

      const res = await fetch("https://api.mixpanel.com/track?verbose=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn(`[Mixpanel] Track failed: status ${res.status}`);
      }
    } catch (err) {
      // Analytics errors must never crash the app
      console.warn(`[Mixpanel] Track error for "${event}":`, err);
    }
  }

  async setPeople(properties: Record<string, any>): Promise<void> {
    try {
      await this.init();

      const payload = [
        {
          $token: this.token,
          $distinct_id: this.distinctId,
          $set: {
            ...properties,
            $last_seen: new Date().toISOString(),
          },
        },
      ];

      await fetch("https://api.mixpanel.com/engage?verbose=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("[Mixpanel] setPeople error:", err);
    }
  }
}

export const mixpanel = new MixpanelService();
