import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { useThemeColors } from "../../lib/theme-colors";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full">
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-12" showsVerticalScrollIndicator={false}>
        <View className="bg-[#0066CC]/10 p-4 rounded-2xl flex-row items-center mb-6 border border-[#0066CC]/20">
          <ShieldCheck size={24} color="#0066CC" style={{ marginRight: 12 }} />
          <View className="flex-1">
            <Text className="font-[Inter_700Bold] text-text-primary text-sm">Your Privacy Matters</Text>
            <Text className="text-xs text-text-muted font-[Inter_500Medium]">This policy details how StayGrid collects, uses, and protects your information.</Text>
          </View>
        </View>

        <View className="space-y-4 mb-8">
          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface">1. Information We Collect</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            We collect personal information including full name, email address, mobile number, account credentials, booking details, device info, and location info (with permission).
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">2. How We Use Your Information</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            To create & manage accounts, process bookings, connect guests with hosts, send booking notifications, prevent fraud, and comply with legal requirements.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">3. Information Sharing</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            We do NOT sell your personal information. Data is shared only with property owners for booking fulfillment, payment providers, and law enforcement when required.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">4. Data Security & Retention</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            We enforce industry-standard security controls to protect your data. Data is retained only for as long as needed to fulfill operational and legal duties.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">5. Your Rights & Children's Privacy</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            You may request account deletion, data correction, or access at any time. StayGrid is not intended for users under 18 years of age.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">6. Contact Us</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            For questions regarding this policy, contact our support team at support@staygrid.in.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
