import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, ScrollView, TextInput, LayoutAnimation, Platform, UIManager } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Heart, Tent, Droplet, Users, Dog, Search } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useFavoriteStore } from "../../lib/store";
import { useThemeColors } from "../../lib/theme-colors";

const API_URL = getApiUrl();

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = [
 { id: 1, name: "Location", Icon: MapPin, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "location" },
 { id: 2, name: "Turf", Icon: Tent, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#10B981", filterKey: "hasTurf" },
 { id: 3, name: "Big Pools", Icon: Droplet, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "hasPool" },
 { id: 4, name: "Couple Friendly", Icon: Users, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f43f5e", filterKey: "isCoupleFriendly" },
 { id: 5, name: "Pet Friendly", Icon: Dog, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f59e0b", filterKey: "isPetFriendly" },
];

const FarmhouseCard = ({ item }: { item: any }) => {
  const router = useRouter();
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const isFavorite = useFavoriteStore((state) => state.isFavorite(item.id));
  const title = item.title || item.name || "Farmhouse Stay";
  const locationText = typeof item.location === "string" ? item.location : (item.location?.city || "Bhiwandi, Maharashtra");
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

 const [farmhouses, setFarmhouses] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadingMore, setLoadingMore] = useState(false);
 const [page, setPage] = useState(1);
 const [hasMore, setHasMore] = useState(true);
 const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
 const [showSearch, setShowSearch] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");

 const fetchFarmhouses = async (pageNum: number, category: string | null) => {
 try {
 let url = `${API_URL}/api/farmhouses?page=${pageNum}&limit=10`;
 if (category && category !== "location") {
 url += `&${category}=true`;
 }
 if (searchQuery) {
 url += `&search=${encodeURIComponent(searchQuery)}`;
 }
 const res = await fetch(url);
 const json = await res.json();
 const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
 let newFarmhouses = data.filter((f: any) => f.isActive);
 
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
 fetchFarmhouses(1, activeCategory);
 }, 500);

 return () => clearTimeout(delayDebounceFn);
 }, [activeCategory, searchQuery]);

 const loadMore = () => {
 if (!loadingMore && hasMore) {
 setLoadingMore(true);
 const nextPage = page + 1;
 setPage(nextPage);
 fetchFarmhouses(nextPage, activeCategory);
 }
 };

 const handleCategoryPress = (filterKey: string) => {
 LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
 if (filterKey === "location") {
 setActiveCategory(null);
 } else {
 if (activeCategory === filterKey) {
 setActiveCategory(null);
 } else {
 setActiveCategory(filterKey);
 }
 }
 };

 return (
 <SafeAreaView className="flex-1 bg-surface dark:bg-surface" edges={['top']}>
 <View className="px-6 py-4 flex-row items-center justify-between border-b border-border dark:border-border">
 <View className="flex-row items-center">
 <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
 <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
 </TouchableOpacity>
 <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">All Farmhouses</Text>
 </View>
 <View className="flex-row items-center space-x-4 gap-4">
 <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
 <Search size={22} color={colors.textPrimary} />
 </TouchableOpacity>
 <TouchableOpacity onPress={() => router.push('/favorites')}>
 <Heart size={22} color={colors.textPrimary} />
 </TouchableOpacity>
 </View>
 </View>

 {showSearch && (
 <View className="px-6 py-4 bg-surface dark:bg-surface border-b border-border dark:border-border">
 <View className="flex-row items-center bg-surface dark:bg-surface px-4 py-2.5 rounded-xl">
 <View style={{ marginRight: 8 }}>
 <Search size={16} color={colors.textMuted} />
 </View>
 <TextInput
 className="flex-1 text-text-primary dark:text-surface text-[13px] font-[Inter_500Medium]"
 placeholder="Search farmhouses..."
 placeholderTextColor={colors.textMuted}
 value={searchQuery}
 onChangeText={setSearchQuery}
 autoFocus
 />
 </View>
 </View>
 )}

 <View className="mt-4 mb-2">
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 32 }}>
 {CATEGORIES.map((cat) => {
 const isActive = activeCategory === cat.filterKey;
 return (
 <TouchableOpacity 
 key={cat.id} 
 onPress={() => handleCategoryPress(cat.filterKey)}
 className="items-center justify-center mr-4"
 >
 <View className={`w-[72px] h-[72px] ${isActive ? cat.bg : 'bg-surface dark:bg-surface'} rounded-[24px] border ${isActive ? cat.border : 'border-border dark:border-border'} items-center justify-center mb-2`}>
 <cat.Icon size={28} color={isActive ? cat.color : colors.textMuted} strokeWidth={2} />
 </View>
 <Text className={`font-[Inter_600SemiBold] text-[11px] tracking-wide ${isActive ? 'text-text-primary dark:text-surface' : 'text-text-muted dark:text-text-muted'}`}>
 {cat.name}
 </Text>
 </TouchableOpacity>
 );
 })}
 </ScrollView>
 </View>

 {loading && page === 1 ? (
 <View className="flex-1 items-center justify-center">
 <ActivityIndicator size="large" color={colors.accentPrimary} />
 <Text className="text-text-muted mt-4 font-[Inter_400Regular]">Loading all destinations...</Text>
 </View>
 ) : farmhouses.length === 0 ? (
 <View className="flex-1 items-center justify-center p-6">
 <View className="py-20 w-full items-center justify-center border-2 border-dashed border-border dark:border-border rounded-3xl">
 <Text className="text-text-muted font-[Inter_400Regular]">No farmhouses found for this filter.</Text>
 {activeCategory && (
 <TouchableOpacity onPress={() => setActiveCategory(null)} className="mt-4 bg-surface dark:bg-surface px-4 py-2 rounded-full">
 <Text className="text-text-primary dark:text-text-muted font-[Inter_600SemiBold]">Clear Filters</Text>
 </TouchableOpacity>
 )}
 </View>
 </View>
 ) : (
 <FlatList
 data={farmhouses}
 keyExtractor={(item) => item.id}
 renderItem={({ item }) => <FarmhouseCard item={item} />}
 contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
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
 </SafeAreaView>
 );
}
