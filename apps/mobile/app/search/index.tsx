import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Search as SearchIcon, MapPin, Calendar, Star, Heart, X, Sparkles, SlidersHorizontal, Tag, Tent, Droplet, Users, Dog } from "lucide-react-native";
import { useRouter } from "expo-router";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useFavoriteStore } from "../../lib/store";
import { useThemeColors } from "../../lib/theme-colors";
import { SkeletonCard } from "../../components/SkeletonCard";
import { inputStyles } from "../../lib/input-styles";

const API_URL = getApiUrl();

const CATEGORY_CHIPS = [
  { id: "all", name: "All Stays", filterKey: "all", Icon: Sparkles },
  { id: "featured", name: "Featured", filterKey: "featured", Icon: Sparkles },
  { id: "cancelled", name: "Cancellation Deals", filterKey: "cancelled", Icon: Tag },
  { id: "hasTurf", name: "Turf", filterKey: "hasTurf", Icon: Tent },
  { id: "hasPool", name: "Big Pools", filterKey: "hasPool", Icon: Droplet },
  { id: "isCoupleFriendly", name: "Couple Friendly", filterKey: "isCoupleFriendly", Icon: Users },
  { id: "isPetFriendly", name: "Pet Friendly", filterKey: "isPetFriendly", Icon: Dog },
];

export default function SearchScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { toggleFavorite, isFavorite } = useFavoriteStore();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [farmhouses, setFarmhouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    let url = `${API_URL}/api/farmhouses?limit=50`;
    if (selectedCategory === "cancelled") {
      url = `${API_URL}/api/farmhouses/cancelled-deals`;
      if (query.trim()) {
        url += `?search=${encodeURIComponent(query.trim())}`;
      }
    } else {
      if (selectedCategory === "featured") {
        url += `&isFeatured=true`;
      } else if (selectedCategory && selectedCategory !== "all") {
        url += `&${selectedCategory}=true`;
      }

      if (query.trim()) {
        url += `&search=${encodeURIComponent(query.trim())}`;
      }
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setFarmhouses(list);
      })
      .catch(() => {
        if (active) setFarmhouses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [query, selectedCategory]);

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface" edges={["top"]}>
      {/* Top Header with Search Field */}
      <View className="px-5 py-3 border-b border-border dark:border-border flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-surface dark:bg-border/40 rounded-full border border-border">
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-surface dark:bg-border/40 px-4 py-2.5 rounded-full border border-border">
          <SearchIcon size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search city, farmhouse title, or location..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            className="flex-1 text-sm font-[Inter_600SemiBold] text-text-primary dark:text-surface"
            style={[inputStyles.native, { color: colors.textPrimary }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Suggested Categories (Row-Wise Chips) */}
        <View className="py-4 border-b border-border/40">
          <Text className="px-5 text-xs font-[Inter_700Bold] text-text-muted uppercase tracking-wider mb-2.5">
            Suggested Categories
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {CATEGORY_CHIPS.map((cat) => {
              const isSelected = selectedCategory === cat.filterKey;
              const IconComp = cat.Icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.filterKey)}
                  className={`flex-row items-center px-4 py-2.5 rounded-full mr-2.5 border ${
                    isSelected ? 'bg-[#0066CC] border-[#0066CC]' : 'bg-surface dark:bg-border/30 border-border'
                  }`}
                >
                  <IconComp size={14} color={isSelected ? "#FFFFFF" : colors.textMuted} style={{ marginRight: 6 }} />
                  <Text className={`font-[Inter_700Bold] text-xs ${isSelected ? 'text-white' : 'text-text-primary dark:text-surface'}`}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filtered Farmhouse Results List */}
        <View className="px-5 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
              {loading ? "Searching..." : `${farmhouses.length} Farmhouses Found`}
            </Text>
          </View>

          {loading ? (
            <View className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : farmhouses.length === 0 ? (
            <View className="items-center justify-center py-16">
              <SearchIcon size={40} color={colors.textMuted} className="mb-3" />
              <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">No Farmhouses Found</Text>
              <Text className="text-xs text-text-muted text-center font-[Inter_500Medium] max-w-[260px]">
                No properties matched your search criteria. Try selecting another category or location.
              </Text>
            </View>
          ) : (
            farmhouses.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/farmhouse/${item.id}`)}
                className="mb-5 bg-surface dark:bg-border/40 rounded-3xl overflow-hidden border border-border shadow-sm"
              >
                <View className="h-48 w-full relative">
                  <Image
                    source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => toggleFavorite(item.id)}
                    className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full items-center justify-center border border-white/20"
                  >
                    <Heart size={16} color={isFavorite(item.id) ? "#f43f5e" : "#FFFFFF"} fill={isFavorite(item.id) ? "#f43f5e" : "transparent"} />
                  </TouchableOpacity>
                  <View className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex-row items-center">
                    <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                    <Text className="text-white font-[Inter_700Bold] text-xs">{item.avgRating || item.rating || "5.0"}</Text>
                  </View>
                </View>
                <View className="p-4">
                  <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-1" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View className="flex-row items-center mb-3">
                    <MapPin size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text className="text-xs font-[Inter_500Medium] text-text-muted">{item.city || "Bhiwandi"}, Maharashtra</Text>
                  </View>
                  <View className="flex-row justify-between items-center border-t border-border/60 pt-3">
                    <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">Starts from</Text>
                    <Text className="text-lg font-[Inter_800ExtraBold] text-[#0066CC]">
                      ₹{item.price12Hours?.toLocaleString('en-IN') || 0} <Text className="text-xs font-[Inter_500Medium] text-text-muted">/ 12h</Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
