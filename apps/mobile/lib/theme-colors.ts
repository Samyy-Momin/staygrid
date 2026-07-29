import { useColorScheme } from "react-native";

export function useThemeColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  return {
    isDark,
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textMuted: isDark ? "#94A3B8" : "#64748B",
    surface: isDark ? "#0F172A" : "#FBFBF9",
    border: isDark ? "#334155" : "#E2E8F0",
    
    // Balanced Color Palette as explicitly specified by User:
    // 1. Action Buttons -> Emerald Green
    // 2. Selection / Active Tabs -> Royal Blue
    // 3. Ratings / Price Highlights -> Amber Yellow
    // 4. Heart / Wishlist -> Vibrant Rose
    accentPrimary: "#10B981",  // Green for Buttons
    accentBlue: "#0066CC",     // Blue for Selection / Active Tabs
    accentPremium: "#F59E0B",  // Amber Yellow for Prices / Ratings
    accentNature: "#16A34A",   // Palm Green
    accentRose: "#F43F5E",     // Vibrant Rose
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    glassBg: isDark ? "rgba(15,23,42,0.75)" : "rgba(251,251,249,0.75)",
    glassBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)",
  };
}
