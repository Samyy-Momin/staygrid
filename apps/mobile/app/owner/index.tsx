import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalendarCheck, Inbox, CalendarX, Phone, Bell, LogOut, ExternalLink, BarChart3 } from "lucide-react-native";
import { authApi } from "../../lib/authApi";
import { ownerApi, istDayKey, formatWhen, SUPPORT_PHONE, OWNER_PANEL_URL } from "../../lib/ownerApi";
import { unregisterPushNotificationsAsync } from "../../lib/notifications";

function Tile({ label, value, icon, tone, onPress }: { label: string; value?: string | number; icon: React.ReactNode; tone: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 m-1.5 rounded-3xl p-5 min-h-[140px] justify-between active:opacity-80" style={{ backgroundColor: tone }}>
      <View className="flex-row justify-between items-start">
        {icon}
        {value !== undefined && <Text className="text-white text-3xl font-[Inter_800ExtraBold]">{value}</Text>}
      </View>
      <Text className="text-white text-lg font-[Inter_700Bold]">{label}</Text>
    </Pressable>
  );
}

export default function OwnerHome() {
  const [name, setName] = useState("");
  useEffect(() => {
    AsyncStorage.getItem("user").then((u) => setName(u ? JSON.parse(u)?.name?.split(" ")[0] || "" : ""));
  }, []);

  const bookings = useQuery({ queryKey: ["owner-bookings"], queryFn: ownerApi.bookings });
  const enquiries = useQuery({ queryKey: ["owner-enquiries"], queryFn: ownerApi.enquiries });
  const notifications = useQuery({ queryKey: ["owner-notifications"], queryFn: ownerApi.notifications });

  // Refresh whenever the owner comes back to this screen.
  useFocusEffect(useCallback(() => { bookings.refetch(); enquiries.refetch(); notifications.refetch(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  const today = istDayKey(new Date());
  const live = (bookings.data || []).filter((b) => b.status === "CONFIRMED");
  const todays = live.filter((b) => istDayKey(b.checkIn) === today);
  const next = live.filter((b) => new Date(b.checkOut) > new Date()).sort((a, b) => +new Date(a.checkIn) - +new Date(b.checkIn))[0];
  const newRequests = (enquiries.data || []).filter((e) => e.status === "NEW").length;
  const unread = (notifications.data || []).filter((n) => !n.readAt).length;
  const refreshing = bookings.isFetching || enquiries.isFetching || notifications.isFetching;

  const logout = async () => {
    await unregisterPushNotificationsAsync().catch(() => null);
    await authApi.signOut().catch(() => null);
    await AsyncStorage.removeItem("user");
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { bookings.refetch(); enquiries.refetch(); notifications.refetch(); }} />}
      >
        <View className="flex-row items-center justify-between px-1.5 mb-3">
          <View>
            <Text className="text-text-muted text-base font-[Inter_500Medium]">Namaste</Text>
            <Text className="text-text-primary text-3xl font-[Inter_800ExtraBold]">{name || "Owner"}</Text>
          </View>
          <Pressable onPress={() => router.push("/owner/alerts")} className="w-14 h-14 rounded-full bg-black/5 items-center justify-center">
            <Bell size={26} color="#1E293B" />
            {unread > 0 && (
              <View className="absolute top-1.5 right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-danger items-center justify-center">
                <Text className="text-white text-xs font-[Inter_700Bold]">{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View className="flex-row">
          <Tile label="Today's guests" value={todays.length} tone="#0F766E" icon={<CalendarCheck size={30} color="#fff" />} onPress={() => router.push("/owner/bookings")} />
          <Tile label="New requests" value={newRequests} tone={newRequests ? "#DC2626" : "#475569"} icon={<Inbox size={30} color="#fff" />} onPress={() => router.push("/owner/requests")} />
        </View>
        <View className="flex-row">
          <Tile label="Block a date" tone="#7C3AED" icon={<CalendarX size={30} color="#fff" />} onPress={() => router.push("/owner/block")} />
          <Tile
            label="Call StayGrid"
            tone="#0066CC"
            icon={<Phone size={30} color="#fff" />}
            onPress={() => (SUPPORT_PHONE ? Linking.openURL(`tel:${SUPPORT_PHONE}`) : null)}
          />
        </View>

        {next && (
          <View className="mx-1.5 mt-4 rounded-3xl border border-border p-5">
            <Text className="text-text-muted font-[Inter_600SemiBold]">NEXT GUEST</Text>
            <Text className="text-text-primary text-xl font-[Inter_700Bold] mt-1">{next.user?.name || "Guest"}</Text>
            <Text className="text-text-primary text-base mt-1">{formatWhen(next.checkIn)}</Text>
            <Text className="text-text-muted mt-0.5">{next.farmhouse.title} · {next.adults + next.children} guests</Text>
            {next.user?.phone && (
              <Pressable onPress={() => Linking.openURL(`tel:${next.user!.phone}`)} className="mt-4 h-14 rounded-2xl bg-success flex-row items-center justify-center active:opacity-80">
                <Phone size={22} color="#fff" />
                <Text className="text-white text-lg font-[Inter_700Bold] ml-2">Call guest</Text>
              </Pressable>
            )}
          </View>
        )}

        {(notifications.data || []).length > 0 && (
          <View className="mx-1.5 mt-4">
            <Text className="text-text-primary text-lg font-[Inter_700Bold] mb-2">Latest alerts</Text>
            {(notifications.data || []).slice(0, 3).map((n) => (
              <Pressable key={n.id} onPress={() => router.push("/owner/alerts")} className={`rounded-2xl p-4 mb-2 ${n.readAt ? "bg-black/5" : "bg-amber-50 border border-amber-200"}`}>
                <Text className="text-text-primary font-[Inter_700Bold]">{n.title}</Text>
                <Text className="text-text-muted mt-0.5" numberOfLines={2}>{n.body}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View className="mx-1.5 mt-6 gap-2">
          <Pressable onPress={() => router.push("/owner/analytics")} className="h-14 rounded-2xl border border-border flex-row items-center justify-center">
            <BarChart3 size={20} color="#1E293B" /><Text className="text-text-primary text-base font-[Inter_600SemiBold] ml-2">My earnings & reports</Text>
          </Pressable>
          {!!OWNER_PANEL_URL && (
            <Pressable onPress={() => Linking.openURL(OWNER_PANEL_URL)} className="h-14 rounded-2xl border border-border flex-row items-center justify-center">
              <ExternalLink size={20} color="#1E293B" /><Text className="text-text-primary text-base font-[Inter_600SemiBold] ml-2">Open full owner panel</Text>
            </Pressable>
          )}
          <Pressable onPress={logout} className="h-14 rounded-2xl flex-row items-center justify-center">
            <LogOut size={20} color="#EF4444" /><Text className="text-danger text-base font-[Inter_600SemiBold] ml-2">Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
