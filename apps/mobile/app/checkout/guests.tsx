import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Minus, Plus, Users } from "lucide-react-native";
import { getApiUrl } from "../../lib/config";
import { GuestCountModal } from "../../components/GuestCountModal";
import { useThemeColors } from "../../lib/theme-colors";

const API_URL = getApiUrl();

export default function GuestSelectionScreen() {
  const { farmhouseId, start, end, type, time } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const [farmhouse, setFarmhouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    target: "adults" | "children";
    value: number;
    min: number;
  }>({
    visible: false,
    title: "",
    target: "adults",
    value: 1,
    min: 1,
  });

  useEffect(() => {
    const fetchFarmhouse = async () => {
      try {
        const res = await fetch(`${API_URL}/api/farmhouses/${farmhouseId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFarmhouse(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (farmhouseId) fetchFarmhouse();
  }, [farmhouseId]);

  const handleContinue = () => {
    const totalGuests = adults + children;
    const capacity = farmhouse?.capacity || 20;
    const includedGuests = farmhouse?.maxIncludedGuests || farmhouse?.includedGuests || capacity;
    const extraFeeRate = farmhouse?.extraGuestFee || 0;
    const maxAllowedLimit = Math.max(100, capacity * 5);
    
    if (totalGuests > maxAllowedLimit) {
      Alert.alert(
        "Limit Exceeded", 
        `Total guest count cannot exceed ${maxAllowedLimit} for this property.`
      );
      return;
    }

    if (totalGuests > includedGuests && extraFeeRate > 0) {
      const extraCount = totalGuests - includedGuests;
      const extraTotal = extraCount * extraFeeRate;
      Alert.alert(
        "Extra Guest Fee Confirmation",
        `Base stay includes ${includedGuests} guests. For ${extraCount} extra guest(s), an additional fee of ₹${extraFeeRate}/person (Total: +₹${extraTotal.toLocaleString('en-IN')}) will be added to your bill.\n\nDo you agree to this add-on charge?`,
        [
          { text: "Edit Guests", style: "cancel" },
          {
            text: "Agree & Proceed",
            onPress: () => {
              router.push(`/checkout/${farmhouseId}?start=${start}&end=${end}&type=${type}&time=${time}&adults=${adults}&children=${children}&extraFee=${extraTotal}`);
            }
          }
        ]
      );
      return;
    }

    router.push(`/checkout/${farmhouseId}?start=${start}&end=${end}&type=${type}&time=${time}&adults=${adults}&children=${children}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center">
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
          <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Who's coming?</Text>
      </View>

      <View className="px-6 py-6 flex-1">
        {/* Outlined Base Capacity Card */}
        <View className="bg-surface dark:bg-surface p-5 rounded-2xl mb-6 flex-row items-center border border-[#0066CC]/40 shadow-sm">
          <View className="w-10 h-10 bg-[#0066CC]/10 rounded-full items-center justify-center mr-3 border border-[#0066CC]/30">
            <Users size={20} color="#0066CC" />
          </View>
          <View>
            <Text className="text-xs font-[Inter_700Bold] text-[#0066CC] uppercase tracking-wider mb-0.5">Base capacity</Text>
            <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-lg">
              {farmhouse?.includedGuests || farmhouse?.maxIncludedGuests || farmhouse?.capacity || 30} guests included
            </Text>
          </View>
        </View>

        {/* Stepper Cards */}
        <View className="space-y-4">
          <View className="bg-surface dark:bg-surface p-4 rounded-2xl flex-row justify-between items-center border border-border dark:border-border shadow-sm mb-3">
            <View>
              <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-0.5">Adults</Text>
              <Text className="text-xs text-text-muted font-[Inter_500Medium]">Ages 13+</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity 
                className={`w-11 h-11 rounded-full items-center justify-center border ${adults <= 1 ? 'border-border bg-surface dark:bg-border/30' : 'border-border bg-surface dark:bg-border'}`}
                onPress={() => setAdults(Math.max(1, adults - 1))}
                disabled={adults <= 1}
              >
                <Minus size={18} color={adults <= 1 ? '#6B7280' : colors.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setModalConfig({
                    visible: true,
                    title: "Enter Number of Adults",
                    target: "adults",
                    value: adults,
                    min: 1,
                  });
                }}
                className="px-3 py-1"
              >
                <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-center">{adults}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-11 h-11 rounded-full items-center justify-center bg-[#0066CC] shadow-md"
                onPress={() => setAdults(adults + 1)}
              >
                <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-surface dark:bg-surface p-4 rounded-2xl flex-row justify-between items-center border border-border dark:border-border shadow-sm mb-4">
            <View>
              <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-0.5">Children</Text>
              <Text className="text-xs text-text-muted font-[Inter_500Medium]">Ages 2-12</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity 
                className={`w-11 h-11 rounded-full items-center justify-center border ${children <= 0 ? 'border-border bg-surface dark:bg-border/30' : 'border-border bg-surface dark:bg-border'}`}
                onPress={() => setChildren(Math.max(0, children - 1))}
                disabled={children <= 0}
              >
                <Minus size={18} color={children <= 0 ? '#6B7280' : colors.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setModalConfig({
                    visible: true,
                    title: "Enter Number of Children",
                    target: "children",
                    value: children,
                    min: 0,
                  });
                }}
                className="px-3 py-1"
              >
                <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-center">{children}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-11 h-11 rounded-full items-center justify-center bg-[#0066CC] shadow-md"
                onPress={() => setChildren(children + 1)}
              >
                <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Capacity Progress Meter Card */}
          <View className="bg-surface dark:bg-surface p-5 rounded-2xl border border-border dark:border-border shadow-sm mt-2">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">
                Total {adults + children} guests
              </Text>
              <Text className={`text-xs font-[Inter_700Bold] ${(adults + children) <= (farmhouse?.includedGuests || 30) ? 'text-[#10B981]' : 'text-[#0066CC]'}`}>
                {(adults + children) <= (farmhouse?.includedGuests || 30) ? 'Within capacity' : 'Extra guest fee applies'}
              </Text>
            </View>

            {/* Visual Progress Bar */}
            <View className="w-full h-2.5 bg-border/40 dark:bg-border/60 rounded-full overflow-hidden mb-2 relative">
              <View 
                className={`h-full rounded-full ${(adults + children) <= (farmhouse?.includedGuests || 30) ? 'bg-[#10B981]' : 'bg-[#0066CC]'}`} 
                style={{ width: `${Math.min(100, ((adults + children) / (farmhouse?.includedGuests || 30)) * 100)}%` }}
              />
            </View>
            <Text className="text-[11px] font-[Inter_500Medium] text-text-muted">
              Marker at {farmhouse?.includedGuests || 30} (included capacity)
            </Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        <TouchableOpacity 
          className="bg-accent-primary py-4 rounded-2xl items-center shadow-md"
          onPress={handleContinue}
        >
          <Text className="text-white font-[Inter_700Bold] text-lg">Proceed to Review</Text>
        </TouchableOpacity>
      </View>

      <GuestCountModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        initialValue={modalConfig.value}
        minValue={modalConfig.min}
        maxValue={Math.max(100, (farmhouse?.capacity || 20) * 5)}
        onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
        onSave={(newVal) => {
          if (modalConfig.target === "adults") {
            setAdults(newVal);
          } else {
            setChildren(newVal);
          }
        }}
      />
    </SafeAreaView>
  );
}
