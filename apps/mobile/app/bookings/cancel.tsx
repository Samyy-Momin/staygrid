import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react-native";
import { api } from "../../lib/authApi";
import { useThemeColors } from "../../lib/theme-colors";
import { StayGridTextArea } from "../../components/ui/StayGridTextField";

export default function CancelBookingScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (bookingId) {
      api.get("/api/bookings/me")
        .then((res: any) => {
          const list = Array.isArray(res.data) ? res.data : [];
          const match = list.find((b: any) => b.id === bookingId);
          setBooking(match || null);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [bookingId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center">
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center p-6">
        <Text className="text-base text-text-muted font-[Inter_500Medium] text-center mb-4">Booking not found or already cancelled.</Text>
        <TouchableOpacity className="bg-accent-primary px-6 py-3 rounded-xl" onPress={() => router.back()}>
          <Text className="text-white font-[Inter_700Bold]">Return to Bookings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Calculate refund policy tier
  const createdAtMs = new Date(booking.createdAt).getTime();
  const checkInMs = new Date(booking.checkIn).getTime();
  const nowMs = Date.now();

  const hoursSinceBooking = (nowMs - createdAtMs) / (1000 * 3600);
  const daysUntilCheckIn = (checkInMs - nowMs) / (1000 * 3600 * 24);

  let refundPercent = 0;
  let tierLabel = "";

  if (hoursSinceBooking <= 2) {
    refundPercent = 100;
    tierLabel = "2-Hour Grace Period (Full Refund)";
  } else if (daysUntilCheckIn >= 30) {
    refundPercent = 100;
    tierLabel = "30+ Days Advance Notice (Full Refund)";
  } else if (daysUntilCheckIn >= 15) {
    refundPercent = 50;
    tierLabel = "15-29 Days Advance Notice (50% Refund)";
  } else {
    refundPercent = 0;
    tierLabel = "Less than 15 Days (No Refund)";
  }

  const refundAmount = Math.round((booking.tokenPaid || 0) * (refundPercent / 100));

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel`, { reason });
      Alert.alert(
        "Booking Cancelled",
        refundAmount > 0 
          ? `Your cancellation has been processed. A refund of ₹${refundAmount.toLocaleString('en-IN')} will be credited to your account.`
          : "Your booking has been cancelled.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/bookings") }]
      );
    } catch (err: any) {
      Alert.alert("Cancellation Failed", err.response?.data?.message || "Something went wrong.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full">
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Cancel Booking</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Farmhouse summary */}
        <View className="bg-surface dark:bg-surface p-5 rounded-3xl border border-border dark:border-border mb-6">
          <Text className="text-xs font-[Inter_700Bold] text-text-muted uppercase tracking-wider mb-1">Target Booking</Text>
          <Text className="text-lg font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-2">{booking.farmhouse?.title}</Text>
          <Text className="text-xs text-text-muted">Check-in: {new Date(booking.checkIn).toLocaleDateString()} • Token Paid: ₹{booking.tokenPaid?.toLocaleString('en-IN')}</Text>
        </View>

        {/* Calculated Refund Card */}
        <View className={`p-5 rounded-3xl border mb-6 ${refundPercent > 0 ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-[#EF4444]/10 border-[#EF4444]/30'}`}>
          <View className="flex-row items-center mb-2">
            {refundPercent > 0 ? (
              <ShieldCheck size={22} color="#10B981" style={{ marginRight: 8 }} />
            ) : (
              <AlertTriangle size={22} color="#EF4444" style={{ marginRight: 8 }} />
            )}
            <Text className={`text-base font-[Inter_700Bold] ${refundPercent > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {tierLabel}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-border/30">
            <Text className="text-sm font-[Inter_600SemiBold] text-text-primary dark:text-surface">Refundable Amount</Text>
            <Text className={`text-2xl font-[Inter_800ExtraBold] ${refundPercent > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              ₹{refundAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Reason Input */}
        <StayGridTextArea
          label="Reason for Cancellation (Optional)"
          placeholder="Please let us know why you are cancelling your stay..."
          value={reason}
          onChangeText={setReason}
          minHeight={90}
          containerClassName="mb-8"
        />
      </ScrollView>

      <View className="p-6 border-t border-border dark:border-border bg-surface dark:bg-surface">
        <TouchableOpacity 
          className="bg-[#EF4444] py-4 rounded-2xl items-center shadow-md"
          onPress={handleCancelConfirm}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-[Inter_700Bold] text-base">Confirm Cancellation</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
