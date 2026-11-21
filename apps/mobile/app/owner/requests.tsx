import { useState } from "react";
import { View, Text, Pressable, FlatList, Linking, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, MessageCircle } from "lucide-react-native";
import { ownerApi, formatWhen, type Enquiry } from "../../lib/ownerApi";
import { OwnerHeader } from "../../components/OwnerHeader";

const TABS: { key: Enquiry["status"]; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Called" },
  { key: "BOOKED", label: "Booked" },
];

export default function OwnerRequests() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Enquiry["status"]>("NEW");
  const { data = [], isFetching, refetch } = useQuery({ queryKey: ["owner-enquiries"], queryFn: ownerApi.enquiries });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Enquiry["status"] }) => ownerApi.setEnquiryStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-enquiries"] }),
  });

  const items = data.filter((e) => e.status === tab);
  const contact = (e: Enquiry, how: "call" | "wa") => {
    if (e.status === "NEW") setStatus.mutate({ id: e.id, status: "CONTACTED" });
    const msg = encodeURIComponent(`Hello ${e.name}, this is ${e.farmhouse.title}. Thank you for your booking request.`);
    Linking.openURL(how === "call" ? `tel:+91${e.phone}` : `https://wa.me/91${e.phone}?text=${msg}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <OwnerHeader title="Booking requests" />
      <View className="flex-row mx-4 mb-2 p-1 rounded-2xl bg-black/5">
        {TABS.map((t) => {
          const n = data.filter((e) => e.status === t.key).length;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} className={`flex-1 h-12 rounded-xl items-center justify-center ${tab === t.key ? "bg-white" : ""}`}>
              <Text className={`text-base font-[Inter_700Bold] ${tab === t.key ? "text-text-primary" : "text-text-muted"}`}>
                {t.label}{n ? ` (${n})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text className="text-text-muted text-center text-base mt-16">No requests here.</Text>}
        renderItem={({ item: e }) => (
          <View className="rounded-3xl border border-border p-5 mb-3">
            <Text className="text-text-primary text-xl font-[Inter_700Bold]">{e.name}</Text>
            <Text className="text-text-muted text-base mt-0.5">{e.phone}</Text>
            <Text className="text-text-primary text-base mt-2">📅 {e.checkIn ? formatWhen(e.checkIn).split(",").slice(0, 2).join(",") : "Date not given"}{e.guests ? `   👥 ${e.guests}` : ""}</Text>
            <Text className="text-text-muted mt-0.5">🏡 {e.farmhouse.title}</Text>
            {!!e.message && <Text className="text-text-primary mt-2 bg-black/5 rounded-xl p-3">{e.message}</Text>}
            <View className="flex-row gap-2 mt-4">
              <Pressable onPress={() => contact(e, "call")} className="flex-1 h-14 rounded-2xl bg-success flex-row items-center justify-center active:opacity-80">
                <Phone size={22} color="#fff" /><Text className="text-white text-lg font-[Inter_700Bold] ml-2">Call</Text>
              </Pressable>
              <Pressable onPress={() => contact(e, "wa")} className="flex-1 h-14 rounded-2xl border border-border flex-row items-center justify-center active:opacity-80">
                <MessageCircle size={22} color="#16A34A" /><Text className="text-text-primary text-lg font-[Inter_700Bold] ml-2">WhatsApp</Text>
              </Pressable>
            </View>
            {e.status !== "BOOKED" && (
              <View className="flex-row gap-2 mt-2">
                <Pressable onPress={() => setStatus.mutate({ id: e.id, status: "BOOKED" })} className="flex-1 h-12 rounded-2xl border border-success items-center justify-center">
                  <Text className="text-success font-[Inter_700Bold]">Booked ✓</Text>
                </Pressable>
                <Pressable onPress={() => setStatus.mutate({ id: e.id, status: "LOST" })} className="flex-1 h-12 rounded-2xl border border-border items-center justify-center">
                  <Text className="text-text-muted font-[Inter_700Bold]">Not interested</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
