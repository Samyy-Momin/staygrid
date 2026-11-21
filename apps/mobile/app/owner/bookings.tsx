import { useState } from "react";
import { View, Text, Pressable, FlatList, Linking, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react-native";
import { ownerApi, istDayKey, formatWhen, type OwnerBooking } from "../../lib/ownerApi";
import { OwnerHeader } from "../../components/OwnerHeader";

const rupees = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function OwnerBookings() {
  const [tab, setTab] = useState<"today" | "upcoming" | "past">("today");
  const { data = [], isFetching, refetch } = useQuery({ queryKey: ["owner-bookings"], queryFn: ownerApi.bookings });

  const now = new Date();
  const today = istDayKey(now);
  const confirmed = data.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
  const groups: Record<typeof tab, OwnerBooking[]> = {
    today: confirmed.filter((b) => istDayKey(b.checkIn) === today),
    upcoming: confirmed.filter((b) => new Date(b.checkIn) > now && istDayKey(b.checkIn) !== today).sort((a, b) => +new Date(a.checkIn) - +new Date(b.checkIn)),
    past: confirmed.filter((b) => new Date(b.checkOut) < now).sort((a, b) => +new Date(b.checkIn) - +new Date(a.checkIn)).slice(0, 50),
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <OwnerHeader title="Guests" />
      <View className="flex-row mx-4 mb-2 p-1 rounded-2xl bg-black/5">
        {(["today", "upcoming", "past"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} className={`flex-1 h-12 rounded-xl items-center justify-center ${tab === t ? "bg-white" : ""}`}>
            <Text className={`text-base font-[Inter_700Bold] ${tab === t ? "text-text-primary" : "text-text-muted"}`}>
              {t === "today" ? "Today" : t === "upcoming" ? "Coming" : "Past"} ({groups[t].length})
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={groups[tab]}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text className="text-text-muted text-center text-base mt-16">No guests here.</Text>}
        renderItem={({ item: b }) => {
          const balance = Math.max(0, b.totalAmount - b.tokenPaid);
          return (
            <View className="rounded-3xl border border-border p-5 mb-3">
              <Text className="text-text-primary text-xl font-[Inter_700Bold]">{b.user?.name || "Guest"}</Text>
              <Text className="text-text-primary text-base mt-1">{formatWhen(b.checkIn)}</Text>
              <Text className="text-text-muted">to {formatWhen(b.checkOut)}</Text>
              <Text className="text-text-muted mt-1">{b.farmhouse.title} · {b.adults + b.children} guests</Text>
              <View className="flex-row mt-3 gap-3">
                <View className="flex-1 rounded-2xl bg-black/5 p-3">
                  <Text className="text-text-muted text-xs font-[Inter_600SemiBold]">TOTAL</Text>
                  <Text className="text-text-primary text-lg font-[Inter_700Bold]">{rupees(b.totalAmount)}</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-amber-50 p-3">
                  <Text className="text-amber-700 text-xs font-[Inter_600SemiBold]">BALANCE DUE</Text>
                  <Text className="text-amber-800 text-lg font-[Inter_700Bold]">{rupees(balance)}</Text>
                </View>
              </View>
              {b.user?.phone && (
                <Pressable onPress={() => Linking.openURL(`tel:${b.user!.phone}`)} className="mt-3 h-14 rounded-2xl bg-success flex-row items-center justify-center active:opacity-80">
                  <Phone size={22} color="#fff" /><Text className="text-white text-lg font-[Inter_700Bold] ml-2">Call guest</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
