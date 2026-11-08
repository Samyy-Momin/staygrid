import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react-native";
import { useThemeColors } from "../../lib/theme-colors";

export default function TermsAndConditionsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const [accepted, setAccepted] = useState(false);

  const handleProceed = () => {
    if (!accepted) {
      Alert.alert("Acceptance Required", "Please accept the Terms & Conditions before proceeding to payment.");
      return;
    }

    // Pass accepted timestamp to final payment step
    const queryStr = new URLSearchParams({
      ...(params as any),
      termsAcceptedAt: new Date().toISOString(),
    }).toString();

    router.push(`/checkout/${params.id}?${queryStr}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full">
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Terms & Conditions</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="bg-accent-primary/10 p-4 rounded-2xl flex-row items-center mb-4 border border-accent-primary/20">
          <ShieldCheck size={24} color={colors.accentPrimary} style={{ marginRight: 12 }} />
          <View className="flex-1">
            <Text className="font-[Inter_700Bold] text-text-primary text-sm">Review & Agreement</Text>
            <Text className="text-xs text-text-muted font-[Inter_500Medium]">Please read StayGrid terms before confirming your booking token payment.</Text>
          </View>
        </View>

        <View className="bg-surface dark:bg-surface p-5 rounded-2xl border border-border dark:border-border mb-4 space-y-4">
          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface">1. Acceptance of Terms</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            By creating an account or using StayGrid, you confirm that you are at least 18 years of age and legally capable of entering into a binding agreement.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">2. Booking & Token Payment</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            A 50% token payment is required to confirm your booking. The remaining 50% balance must be paid in cash or online at check-in. Custom multi-day stays require full payment up front.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">3. Cancellation & Refund Policy</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            • Cancellation within 2 hours of booking: 100% refund (Grace Period).{"\n"}
            • Cancellation 30 days or more before check-in: 100% refund.{"\n"}
            • Cancellation 15 to 29 days before check-in: 50% refund.{"\n"}
            • Cancellation less than 15 days before check-in: No refund (0%).
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">4. User Responsibilities & Property Damage</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            Guests are responsible for any damage caused to the property, furniture, appliances, or landscaping during their stay. Plucking flowers/crops or disturbing private areas is strictly prohibited.
          </Text>
        </View>
      </ScrollView>

      {/* STICKY BOTTOM BAR: Checkbox + Accept Button always visible without scrolling */}
      <View className="p-5 border-t border-border dark:border-border bg-surface dark:bg-surface shadow-2xl space-y-3">
        <TouchableOpacity 
          className={`flex-row items-center p-3.5 rounded-xl border ${accepted ? 'bg-[#10B981]/15 border-[#10B981]' : 'bg-surface dark:bg-border/30 border-border'}`}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.8}
        >
          <View className={`w-6 h-6 rounded-md items-center justify-center mr-3 border ${accepted ? 'bg-[#10B981] border-[#10B981]' : 'border-border bg-surface'}`}>
            {accepted && <CheckCircle2 size={16} color="#FFFFFF" />}
          </View>
          <Text className="flex-1 font-[Inter_700Bold] text-xs text-text-primary dark:text-surface">
            I have read and agree to StayGrid's Terms & Conditions.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className={`py-4 rounded-2xl items-center shadow-md ${accepted ? 'bg-[#0066CC]' : 'bg-[#9CA3AF]'}`}
          onPress={handleProceed}
          disabled={!accepted}
        >
          <Text className="text-white font-[Inter_700Bold] text-base">Accept & Continue →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
