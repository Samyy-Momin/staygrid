import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, ScrollView, TextInput, LayoutAnimation, Platform, UIManager } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Heart, Tent, Droplet, Users, Dog, Search, Star, Sparkles, X, RotateCcw } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useFavoriteStore } from "../../lib/store";
import { useThemeColors } from "../../lib/theme-colors";
import { SkeletonCard } from "../../components/SkeletonCard";
import { LocationPickerModal } from "../../components/LocationPickerModal";
import { useCategories } from "../../lib/useCategories";
import { inputStyles } from "../../lib/input-styles";

const API_URL = getApiUrl();

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = [
  { id: 0, name: "All Stays", Icon: Sparkles, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "all" },
  { id: 1, name: "Location", Icon: MapPin, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "location" },
  { id: 2, name: "Top Rated", Icon: Star, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#F59E0B", filterKey: "sortBy=rating" },
  { id: 3, name: "Turf", Icon: Tent, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#10B981", filterKey: "hasTurf" },
  { id: 4, name: "Big Pools", Icon: Droplet, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "hasPool" },
  { id: 5, name: "Couple Friendly", Icon: Users, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f43f5e", filterKey: "isCoupleFriendly" },
  { id: 6, name: "Pet Friendly", Icon: Dog, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f59e0b", filterKey: "isPetFriendly" },
];

const FarmhouseCard = ({ item }: { item: any }) => {
  const router = useRouter();
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const isFavorite = useFavoriteStore((state) => state.isFavorite(item.id));
  const title = item.title || item.name || "Farmhouse Stay";
  const locationText = typeof item.location === "string" ? item.location : (item.city || item.address || "Bhiwandi, Maharashtra");
  const price = item.price12Hours || item.price24Hours || 0;

  return (
    <TouchableOpacity onPress={() => router.push(`/farmhouse/${item.id}`)} className="mb-5 bg-surface dark:bg-surface rounded-2xl overflow-hidden border border-border dark:border-border shadow-sm">
      <View className="h-48 w-full relative">
        <Image 
          source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }} 
          className="w-full h-full" 
          resizeMode="cover" 
        />
        <TouchableOpacity 
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-black/40 rounded-full items-center justify-center border border-white/20"
        >
          <Heart size={18} color={isFavorite ? "#f43f5e" : "#3A3A3C"} fill={isFavorite ? "#f43f5e" : "transparent"} />
        </TouchableOpacity>
        {item.avgRating ? (
          <View className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-full flex-row items-center backdrop-blur-md">
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-white text-xs font-[Inter_700Bold] ml-1">{item.avgRating} ({item.reviewCount || 0})</Text>
          </View>
        ) : null}
      </View>
      <View className="p-4">
        <Text className="font-[Inter_700Bold] text-lg text-text-primary dark:text-surface mb-1">{title}</Text>
        <Text className="text-sm text-text-muted font-[Inter_500Medium] mb-3">{locationText}</Text>
        <View className="flex-row justify-between items-center pt-3 border-t border-border dark:border-border">
          <Text className="font-[Inter_800ExtraBold] text-base text-accent-primary">₹{Number(price).toLocaleString('en-IN')}<Text className="text-xs font-[Inter_400Regular] text-text-muted"> / 12 Hours</Text></Text>
          <View className="flex-row items-center space-x-2">
            {item.roomCount ? <Text className="text-xs font-[Inter_600SemiBold] bg-surface dark:bg-border px-2.5 py-1 rounded-md text-text-muted">{item.roomCount} Beds</Text> : null}
            {item.capacity ? <Text className="text-xs font-[Inter_600SemiBold] bg-surface dark:bg-border px-2.5 py-1 rounded-md text-text-muted">{item.capacity} Guests</Text> : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function AllFarmhousesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const initialCategory = Array.isArray(params.category) ? params.category[0] : params.category || null;
  const initialCity = Array.isArray(params.city) ? params.city[0] : params.city || null;

  const { categories } = useCategories();
  const [farmhouses, setFarmhouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory === "all" ? null : initialCategory);
  const [selectedCity, setSelectedCity] = useState<string | null>(initialCity);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (params.city && typeof params.city === "string") {
      setSelectedCity(params.city);
    }
    if (params.category) {
      const cat = Array.isArray(params.category) ? params.category[0] : params.category;
      setActiveCategory(cat === "all" ? null : cat);
    }
  }, [params.city, params.category]);

  const fetchFarmhouses = async (pageNum: number, category: string | null, city: string | null) => {
    try {
      let url = `${API_URL}/api/farmhouses?page=${pageNum}&limit=10`;
      if (category === "cancelled") {
        url = `${API_URL}/api/farmhouses/cancelled-deals`;
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
        }
      } else {
        if (city) {
          url += `&city=${encodeURIComponent(city)}`;
        }
        if (category === "featured") {
          url += `&isFeatured=true`;
        } else if (category === "sortBy=rating") {
          url += `&sortBy=rating`;
        } else if (category && category !== "location" && category !== "all") {
          url += `&${category}=true`;
        }
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
      }

      const res = await fetch(url);
      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      let newFarmhouses = data.filter((f: any) => f.isActive !== false);
      
      if (pageNum === 1) {
        setFarmhouses(newFarmhouses);
      } else {
        setFarmhouses(prev => [...prev, ...newFarmhouses]);
      }
      
      setHasMore(pageNum < (json.meta?.totalPages || 1));
    } catch (err) {
      console.error("Failed to fetch farmhouses", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    
    const delayDebounceFn = setTimeout(() => {
      fetchFarmhouses(1, activeCategory, selectedCity);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [activeCategory, selectedCity, searchQuery]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFarmhouses(nextPage, activeCategory, selectedCity);
    }
  };

  const handleCategoryPress = (filterKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (filterKey === "all") {
      setActiveCategory(null);
      setSelectedCity(null);
    } else if (filterKey === "location") {
      setShowLocationModal(true);
    } else {
      if (activeCategory === filterKey) {
        setActiveCategory(null);
      } else {
        setActiveCategory(filterKey);
      }
    }
  };

  const clearAllFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(null);
    setSelectedCity(null);
    setSearchQuery("");
  };

  // Build category list with All Stays at index 0
  const categoryList = [
    { id: "all", name: "All Stays", filterKey: "all", Icon: Sparkles, color: "#0066CC" },
    ...categories,
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface" edges={['top']}>
      {/* Top Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border dark:border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
            <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
            {selectedCity ? `Stays in ${selectedCity}` : "All Farmhouses"}
          </Text>
        </View>
        <View className="flex-row items-center space-x-4 gap-4">
          <TouchableOpacity onPress={() => router.push("/search")}>
            <Search size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View className="px-6 py-4 bg-surface dark:bg-surface border-b border-border dark:border-border">
          <View className="flex-row items-center bg-surface dark:bg-surface px-4 py-2.5 rounded-xl border border-border">
            <View style={{ marginRight: 8 }}>
              <Search size={16} color={colors.textMuted} />
            </View>
            <TextInput
              className="flex-1 text-text-primary dark:text-surface text-[13px] font-[Inter_500Medium]"
              style={[inputStyles.native, { color: colors.textPrimary }]}
              placeholder="Search by title, city..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        </View>
      )}

      {/* SQUARE Category Cards Row */}
      <View className="mt-4 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 32 }}>
          {categoryList.map((cat) => {
            const IconComp = cat.Icon || Sparkles;
            const isLocationPill = cat.filterKey === "location";
            const isAllPill = cat.filterKey === "all";
            const isActive = isLocationPill 
              ? !!selectedCity 
              : (isAllPill ? (!activeCategory && !selectedCity) : activeCategory === cat.filterKey);

            return (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => handleCategoryPress(cat.filterKey)}
                className="items-center justify-center mr-4"
              >
                <View className={`w-20 h-20 rounded-2xl border-2 overflow-hidden shadow-sm items-center justify-center ${
                  isActive ? 'border-[#0066CC] bg-[#0066CC]/10' : 'border-border dark:border-border bg-surface dark:bg-surface'
                }`}>
                  {cat.imageUrl ? (
                    <Image 
                      source={{ uri: getFullImageUrl(cat.imageUrl) }} 
                      className="w-full h-full rounded-2xl" 
                      resizeMode="cover" 
                    />
                  ) : (
                    <IconComp size={28} color={isActive ? "#0066CC" : colors.textMuted} strokeWidth={2} />
                  )}
                </View>
                <Text className={`font-[Inter_700Bold] text-[11px] text-center mt-1.5 ${isActive ? 'text-[#0066CC]' : 'text-text-muted dark:text-text-muted'}`} numberOfLines={1}>
                  {isLocationPill && selectedCity ? selectedCity : cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Clean Clear Category Button Only (NO Text Banner) */}
      {(activeCategory || selectedCity || searchQuery) && (
        <View className="px-6 py-2 flex-row justify-end my-1">
          <TouchableOpacity onPress={clearAllFilters} className="flex-row items-center px-4 py-2 bg-[#0066CC] rounded-full shadow-sm">
            <RotateCcw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text className="text-white font-[Inter_700Bold] text-xs">Clear Category Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skeleton Loading State (Replaces center ActivityIndicator spinner) */}
      {loading && page === 1 ? (
        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : farmhouses.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="py-16 w-full items-center justify-center border-2 border-dashed border-border dark:border-border rounded-3xl p-6">
            <Text className="text-text-muted font-[Inter_600SemiBold] text-center mb-2">No farmhouses found matching your selection.</Text>
            <TouchableOpacity onPress={clearAllFilters} className="mt-4 bg-[#0066CC] px-6 py-3 rounded-2xl flex-row items-center">
              <RotateCcw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text className="text-white font-[Inter_700Bold] text-sm">Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={farmhouses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FarmhouseCard item={item} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={colors.accentPrimary} />
              </View>
            ) : null
          }
        />
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationModal}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          if (city) setActiveCategory(null);
        }}
        onClose={() => setShowLocationModal(false)}
      />
    </SafeAreaView>
  );
}
