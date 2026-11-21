import { useEffect } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "../../lib/ownerApi";
import { OwnerHeader } from "../../components/OwnerHeader";

const URGENT = new Set(["WEBSITE_PAYMENT_DUE", "WEBSITE_SUSPENDED", "WEBSITE_ENQUIRY", "OWNER_NEW_BOOKING"]);

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} hr ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function OwnerAlerts() {
  const qc = useQueryClient();
  const { data = [], isFetching, refetch } = useQuery({ queryKey: ["owner-notifications"], queryFn: ownerApi.notifications });
  const hasUnread = data.some((n) => !n.readAt);

  // Opening this screen marks everything as read (badge clears on the home screen).
  useEffect(() => {
    if (hasUnread) ownerApi.markAllRead().then(() => qc.invalidateQueries({ queryKey: ["owner-notifications"] })).catch(() => null);
  }, [hasUnread, qc]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <OwnerHeader title="Alerts" />
      <FlatList
        data={data}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text className="text-text-muted text-center text-base mt-16">No alerts yet.</Text>}
        renderItem={({ item: n }) => (
          <View className={`rounded-2xl p-4 mb-2 ${URGENT.has(n.type) ? "bg-amber-50 border border-amber-200" : "bg-black/5"}`}>
            <View className="flex-row justify-between">
              <Text className="flex-1 text-text-primary text-base font-[Inter_700Bold]">{n.title}</Text>
              <Text className="text-text-muted text-xs ml-2">{ago(n.createdAt)}</Text>
            </View>
            <Text className="text-text-primary mt-1 text-base">{n.body}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
