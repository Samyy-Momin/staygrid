import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { CheckCircle2, Camera, ArrowRight, ShieldCheck, Check } from "lucide-react-native";
import { useThemeColors } from "../../lib/theme-colors";

const INSTAGRAM_URL = "https://www.instagram.com/staygridmumbai";

export default function SocialFollowScreen() {
  const { farmhouseId, bookingId } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [agreed, setAgreed] = useState(false);

  const handleOpenInstagram = () => {
    Linking.openURL(INSTAGRAM_URL);
  };

  const handleProceedToApp = () => {
    router.replace({ 
      pathname: "/reviews/new", 
      params: { farmhouseId, bookingId } 
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      {step === 1 ? (
        // PAGE 1: Booking Guidelines & Acceptance
        <View className="flex-1">
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 160 }} 
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-14 h-14 bg-[#10B981]/15 rounded-full items-center justify-center mb-2">
                <CheckCircle2 size={32} color="#10B981" />
              </View>
              <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-center">Booking Confirmed!</Text>
              <Text className="text-xs font-[Inter_500Medium] text-text-muted text-center mt-0.5">Please review your stay guidelines below.</Text>
            </View>

            {/* Booking Guidelines Section */}
            <View className="bg-surface dark:bg-surface p-5 rounded-3xl border border-border dark:border-border mb-4 shadow-sm">
              <View className="flex-row items-center mb-4 pb-3 border-b border-border/40">
                <ShieldCheck size={22} color="#0066CC" style={{ marginRight: 8 }} />
                <Text className="text-lg font-[Inter_800ExtraBold] text-text-primary dark:text-surface">Booking Guidelines</Text>
              </View>

              <Text className="text-xs text-text-muted font-[Inter_500Medium] mb-4">
                Please read the following terms carefully before confirming your stay.
              </Text>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">Cancellation Policy</Text>
                  <Text className="text-xs text-text-muted leading-relaxed">
                    • Cancellation 30 days or more before check-in: 100% refund.{"\n"}
                    • Cancellation 15 to 29 days before check-in: 50% refund.{"\n"}
                    • Cancellation less than 15 days before check-in: No refund (0%).{"\n"}
                    Refunds, if applicable, will be processed to original payment method.
                  </Text>
                </View>

                <View className="pt-2">
                  <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">Damage Policy</Text>
                  <Text className="text-xs text-text-muted leading-relaxed">
                    Guests are responsible for any damage caused to property, furniture, appliances, décor, or belongings during their stay. The cost of repair or replacement will be recovered after assessment by property owner.
                  </Text>
                </View>

                <View className="pt-2">
                  <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">Cleanliness</Text>
                  <Text className="text-xs text-text-muted leading-relaxed">
                    Guests are expected to maintain cleanliness throughout their stay. Dispose of waste in designated bins and leave property in clean condition.
                  </Text>
                </View>

                <View className="pt-2">
                  <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">Respect Property & Staff</Text>
                  <Text className="text-xs text-text-muted leading-relaxed">
                    Please treat property owners, caretakers, staff, neighbors, and fellow guests with courtesy and respect. Abusive language or disruptive behavior may result in stay termination without refund.
                  </Text>
                </View>

                <View className="pt-2">
                  <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">Garden & Private Areas</Text>
                  <Text className="text-xs text-text-muted leading-relaxed">
                    Plucking flowers, fruits, vegetables, or damaging trees/lawns is strictly prohibited. Entering restricted private areas is forbidden.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* STICKY BOTTOM BAR: Checkbox + Accept Button always visible without scrolling */}
          <View 
            className="absolute bottom-0 w-full bg-surface dark:bg-surface pt-3 px-6 border-t border-border dark:border-border shadow-2xl space-y-3"
            style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
          >
            <TouchableOpacity 
              className={`flex-row items-center p-3.5 rounded-xl border ${agreed ? 'bg-[#10B981]/15 border-[#10B981]' : 'bg-surface dark:bg-border/30 border-border'}`}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View className={`w-6 h-6 rounded-md items-center justify-center mr-3 border ${agreed ? 'bg-[#10B981] border-[#10B981]' : 'border-border bg-surface'}`}>
                {agreed && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text className="flex-1 font-[Inter_700Bold] text-xs text-text-primary dark:text-surface">
                I have read and agree to StayGrid's Booking Guidelines.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`py-4 rounded-2xl items-center shadow-sm ${agreed ? 'bg-[#0066CC]' : 'bg-[#9CA3AF]'}`}
              onPress={() => setStep(2)}
              disabled={!agreed}
            >
              <Text className="text-white font-[Inter_700Bold] text-base">Accept & Continue →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // PAGE 2: Guidelines Accepted & Join StayGrid Community
        <View className="flex-1 px-6 pt-8">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-success/15 rounded-full items-center justify-center mb-3 border border-success/30">
              <CheckCircle2 size={48} color="#10B981" />
            </View>
            <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-center mb-1">
              🎉 Guidelines Accepted!
            </Text>
            <Text className="text-sm font-[Inter_700Bold] text-success text-center mb-2">
              Your Booking is 100% Confirmed
            </Text>
            <Text className="text-xs font-[Inter_500Medium] text-text-muted text-center max-w-[280px]">
              Follow StayGrid for property tours and booking updates.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-[#E1306C] p-5 rounded-3xl flex-row items-center justify-between mb-6 shadow-md"
            onPress={handleOpenInstagram}
          >
            <View className="flex-row items-center flex-1 mr-2">
              <Camera size={28} color="#FFFFFF" style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-white font-[Inter_800ExtraBold] text-lg">Follow on Instagram</Text>
                <Text className="text-white/80 font-[Inter_500Medium] text-xs">@staygridmumbai • Real farmhouse tours</Text>
              </View>
            </View>
            <ArrowRight size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-full bg-[#10B981] py-4 rounded-2xl items-center shadow-md mt-auto mb-10"
            onPress={handleProceedToApp}
          >
            <Text className="text-white font-[Inter_700Bold] text-base">Write Review & View Booking Ticket →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
