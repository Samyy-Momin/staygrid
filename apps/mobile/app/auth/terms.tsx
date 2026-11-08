import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { useThemeColors } from "../../lib/theme-colors";

export default function TermsAndConditionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full">
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Terms & Conditions</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-12" showsVerticalScrollIndicator={false}>
        <View className="bg-[#0066CC]/10 p-4 rounded-2xl flex-row items-center mb-6 border border-[#0066CC]/20">
          <ShieldCheck size={24} color="#0066CC" style={{ marginRight: 12 }} />
          <View className="flex-1">
            <Text className="font-[Inter_700Bold] text-text-primary text-sm">StayGrid Terms of Service</Text>
            <Text className="text-xs text-text-muted font-[Inter_500Medium]">Please read these terms carefully before using StayGrid.</Text>
          </View>
        </View>

        <View className="space-y-4 mb-8">
          <Text className="text-sm text-text-muted leading-relaxed">
            Welcome to StayGrid. By accessing or using the StayGrid mobile application, website, or related services, you agree to comply with these Terms & Conditions. If you do not agree with these terms, please do not use our services.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">1. Acceptance of Terms</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            By creating an account or using StayGrid, you confirm that you are at least 18 years of age and legally capable of entering into a binding agreement.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">2. About StayGrid</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            StayGrid is a platform that helps users discover, explore, and connect with property owners or managers for stays, including farmhouses, villas, resorts, and other accommodations. StayGrid may facilitate bookings but does not own or operate the listed properties unless explicitly stated.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">3. User Accounts</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            Users are responsible for providing accurate information, keeping login credentials secure, maintaining account confidentiality, and informing StayGrid immediately of any unauthorized account activity. StayGrid reserves the right to suspend or terminate accounts involved in fraudulent, abusive, or illegal activities.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">4. Bookings</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            All bookings are subject to property availability. Property owners or managers are responsible for listing accuracy, pricing, amenities, and availability. Booking confirmations are subject to property acceptance.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">5. Payments</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            Payments are processed through secure third-party payment providers. StayGrid is not responsible for payment gateway failures, banking issues, or transaction delays. Applicable cancellation policies are displayed before booking.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">6. Cancellations and Refunds</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            Cancellation and refund policies vary between properties. Users are advised to review property cancellation policies before confirming a booking. Refunds are returned through the original payment method within standard processing times.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">7. User Responsibilities</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            Users agree not to provide false information, damage property, disturb neighbors, violate local laws, or use the platform for unlawful activities. Users are responsible for any damage caused during their stay.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">8. Property Listings</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            Property owners are solely responsible for listing accurate information, maintaining their property, honoring confirmed bookings, and complying with applicable laws.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">9. Intellectual Property</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            All content on StayGrid, including logos, text, graphics, images, software, and designs, is owned by or licensed to StayGrid and protected by intellectual property laws.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">10. Limitation of Liability</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            StayGrid acts as a technology platform. StayGrid shall not be liable for property conditions, injuries, accidents, or losses occurring during a stay, or actions/omissions of property owners or guests.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">11. Privacy</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            Your use of StayGrid is also governed by our Privacy Policy, which explains how we collect, use, and protect your information.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">12. Suspension or Termination</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            StayGrid reserves the right to suspend or permanently terminate access to any user who violates these Terms or engages in illegal activities.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">13. Changes to Terms</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            StayGrid may update these Terms & Conditions from time to time. Continued use of the platform constitutes acceptance of revised Terms.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">14. Governing Law</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India.
          </Text>

          <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface pt-2">15. Contact Us</Text>
          <Text className="text-sm text-text-muted leading-relaxed">
            For questions regarding these Terms & Conditions, please contact us through the support section of the StayGrid app or via support@staygrid.in.
          </Text>
        </View>
      </ScrollView>

      {/* Read-Only Legal Notice Footer */}
      <View className="p-6 border-t border-border dark:border-border bg-surface dark:bg-surface">
        <Text className="text-xs text-text-muted text-center font-[Inter_500Medium]">
          By logging in or using StayGrid, you acknowledge and agree to these Terms & Conditions.
        </Text>
      </View>
    </SafeAreaView>
  );
}
