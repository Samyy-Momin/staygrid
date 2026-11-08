import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { MapPin, Search, X, Check, Building2 } from "lucide-react-native";
import { api } from "../lib/authApi";
import { useThemeColors } from "../lib/theme-colors";
import { inputStyles } from "../lib/input-styles";

interface LocationPickerModalProps {
  visible: boolean;
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
  onClose: () => void;
}

const DEFAULT_LOCATIONS = [
  { name: "Bhiwandi", count: 12 },
  { name: "Mahapoli", count: 8 },
  { name: "Padgha", count: 6 },
  { name: "Mahabaleshwar", count: 15 },
  { name: "Lonavala", count: 18 },
  { name: "Karjat", count: 10 },
  { name: "Igatpuri", count: 9 },
  { name: "Shahapur", count: 7 },
];

export function LocationPickerModal({
  visible,
  selectedCity,
  onSelectCity,
  onClose,
}: LocationPickerModalProps) {
  const colors = useThemeColors();
  const [locations, setLocations] = useState<any[]>(DEFAULT_LOCATIONS);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      api.get("/api/farmhouses/locations")
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setLocations(res.data);
          }
        })
        .catch(() => setLocations(DEFAULT_LOCATIONS));
    }
  }, [visible]);

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/65 justify-end">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View className="bg-surface dark:bg-surface rounded-t-[36px] p-6 shadow-2xl h-[75%] z-10 border-t border-white/10">
          <View className="w-12 h-1.5 bg-border dark:bg-border rounded-full mx-auto mb-4 opacity-80" />

          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-border/40">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-[#0066CC]/15 items-center justify-center mr-3">
                <MapPin size={22} color="#0066CC" />
              </View>
              <View>
                <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                  Select Destination
                </Text>
                <Text className="text-xs text-text-muted font-[Inter_500Medium]">
                  Choose location to filter farmhouses
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-surface dark:bg-border rounded-full border border-border dark:border-border">
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View className="flex-row items-center bg-surface dark:bg-border/60 px-4 py-3 rounded-2xl border border-border dark:border-border mb-4">
            <Search size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-sm font-[Inter_600SemiBold] text-text-primary dark:text-surface"
              style={[inputStyles.native, { color: colors.textPrimary }]}
              placeholder="Search Bhiwandi, Mahapoli, Lonavala..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Location Items List */}
          <FlatList
            data={[{ name: "All Locations", count: null }, ...filteredLocations]}
            keyExtractor={(item) => item.name}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isAll = item.name === "All Locations";
              const isSelected = isAll ? !selectedCity : selectedCity?.toLowerCase() === item.name.toLowerCase();

              return (
                <TouchableOpacity
                  onPress={() => {
                    onSelectCity(isAll ? null : item.name);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl mb-3 flex-row items-center justify-between border ${
                    isSelected
                      ? "bg-[#0066CC]/15 border-[#0066CC]"
                      : "bg-surface dark:bg-border/40 border-border dark:border-border"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${
                      isSelected ? "bg-[#0066CC]" : "bg-surface dark:bg-border"
                    }`}>
                      {isAll ? (
                        <Building2 size={18} color={isSelected ? "#FFFFFF" : colors.textPrimary} />
                      ) : (
                        <MapPin size={18} color={isSelected ? "#FFFFFF" : "#0066CC"} />
                      )}
                    </View>
                    <View>
                      <Text className={`font-[Inter_800ExtraBold] text-base ${
                        isSelected ? "text-[#0066CC]" : "text-text-primary dark:text-surface"
                      }`}>
                        {item.name}
                      </Text>
                      {!isAll && (
                        <Text className="text-xs text-text-muted font-[Inter_500Medium]">
                          Verified StayGrid Destination
                        </Text>
                      )}
                    </View>
                  </View>

                  {isSelected && <Check size={20} color="#0066CC" strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
