import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, type DateData } from "react-native-calendars";
import { ownerApi, istDayKey } from "../../lib/ownerApi";
import { OwnerHeader } from "../../components/OwnerHeader";

export default function BlockDate() {
  const qc = useQueryClient();
  const farmhouses = useQuery({ queryKey: ["owner-farmhouses"], queryFn: ownerApi.farmhouses });
  const [farmhouseId, setFarmhouseId] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!farmhouseId && farmhouses.data?.length) setFarmhouseId(farmhouses.data[0].id);
  }, [farmhouses.data, farmhouseId]);

  const blocked = useQuery({
    queryKey: ["owner-blocked", farmhouseId],
    queryFn: () => ownerApi.blockedDates(farmhouseId!),
    enabled: !!farmhouseId,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner-blocked", farmhouseId] });

  const block = useMutation({
    mutationFn: () => ownerApi.blockDay(farmhouseId!, day!),
    onSuccess: () => { setMessage({ ok: true, text: "Date blocked. Guests can't book it now." }); setDay(null); refresh(); },
    onError: (e: any) => setMessage({ ok: false, text: e?.message || "Could not block this date" }),
  });
  const unblock = useMutation({ mutationFn: ownerApi.unblock, onSuccess: refresh });

  const today = istDayKey(new Date());
  const marked = useMemo(() => {
    const m: Record<string, any> = {};
    for (const b of blocked.data || []) {
      // mark every day inside the blocked range
      for (let t = new Date(b.startDate).getTime(); t < new Date(b.endDate).getTime(); t += 86400000) {
        m[istDayKey(new Date(t))] = { selected: true, selectedColor: "#DC2626" };
      }
    }
    if (day) m[day] = { selected: true, selectedColor: "#7C3AED" };
    return m;
  }, [blocked.data, day]);

  const upcoming = (blocked.data || []).filter((b) => new Date(b.endDate) > new Date()).sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <OwnerHeader title="Block a date" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {farmhouses.isLoading ? (
          <ActivityIndicator className="mt-10" />
        ) : (farmhouses.data || []).length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {farmhouses.data!.map((f) => (
              <Pressable key={f.id} onPress={() => { setFarmhouseId(f.id); setDay(null); }} className={`px-5 h-12 mr-2 rounded-full items-center justify-center border ${farmhouseId === f.id ? "bg-text-primary border-text-primary" : "border-border"}`}>
                <Text className={`text-base font-[Inter_600SemiBold] ${farmhouseId === f.id ? "text-white" : "text-text-primary"}`}>{f.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Text className="text-text-muted text-base mb-2">Tap the day you want to close. Red days are already closed.</Text>
        <View className="rounded-3xl border border-border overflow-hidden">
          <Calendar
            minDate={today}
            markedDates={marked}
            onDayPress={(d: DateData) => { setMessage(null); setDay(d.dateString); }}
            theme={{ textDayFontSize: 18, textMonthFontSize: 20, textDayHeaderFontSize: 14, todayTextColor: "#0066CC", arrowColor: "#1E293B" }}
          />
        </View>

        {message && <Text className={`text-base mt-3 ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</Text>}

        <Pressable
          disabled={!day || block.isPending}
          onPress={() => block.mutate()}
          className={`mt-4 h-16 rounded-2xl items-center justify-center ${day ? "bg-[#7C3AED]" : "bg-black/10"}`}
        >
          <Text className={`text-lg font-[Inter_700Bold] ${day ? "text-white" : "text-text-muted"}`}>
            {block.isPending ? "Blocking..." : day ? `Block ${new Date(day + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long" })}` : "Choose a day first"}
          </Text>
        </Pressable>

        {upcoming.length > 0 && (
          <View className="mt-6">
            <Text className="text-text-primary text-lg font-[Inter_700Bold] mb-2">Closed days</Text>
            {upcoming.map((b) => (
              <View key={b.id} className="flex-row items-center rounded-2xl border border-border p-4 mb-2">
                <Text className="flex-1 text-text-primary text-base">
                  {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {istDayKey(new Date(new Date(b.endDate).getTime() - 1)) !== istDayKey(b.startDate)
                    ? ` – ${new Date(new Date(b.endDate).getTime() - 1).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                    : ""}
                  {b.note ? ` · ${b.note}` : ""}
                </Text>
                <Pressable
                  onPress={() => Alert.alert("Open this date again?", "Guests will be able to book it.", [
                    { text: "No", style: "cancel" },
                    { text: "Yes, open", onPress: () => unblock.mutate(b.id) },
                  ])}
                  className="px-4 h-11 rounded-xl border border-border items-center justify-center"
                >
                  <Text className="text-text-primary font-[Inter_600SemiBold]">Unblock</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
