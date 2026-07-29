import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, FlatList, ImageBackground, Dimensions } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, MapPin, Star, Heart, Droplet, Trees, PartyPopper, X, ChevronRight, Tent, Users, Dog, Bell, CalendarCheck, SlidersHorizontal, Sparkles } from "lucide-react-native";
import { useFavoriteStore } from "../../lib/store";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeColors } from "../../lib/theme-colors";
import { SkeletonCard } from "../../components/SkeletonCard";
import { EmptyState } from "../../components/EmptyState";

const CATEGORIES = [
 { id: 1, name: "Location", Icon: MapPin, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "location" },
 { id: 2, name: "Turf", Icon: Tent, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#10B981", filterKey: "hasTurf" },
 { id: 3, name: "Big Pools", Icon: Droplet, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "hasPool" },
 { id: 4, name: "Couple Friendly", Icon: Users, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f43f5e", filterKey: "isCoupleFriendly" },
 { id: 5, name: "Pet Friendly", Icon: Dog, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f59e0b", filterKey: "isPetFriendly" },
];

const API_URL = getApiUrl();
const { width } = Dimensions.get("window");

import { api, authApi } from "../../lib/authApi";

export default function HomeScreen() {
 const router = useRouter();
 const [featuredFarmhouses, setFeaturedFarmhouses] = useState<any[]>([]);
 const [allFarmhouses, setAllFarmhouses] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [activeCategory, setActiveCategory] = useState<string | null>(null);
 const { toggleFavorite, isFavorite } = useFavoriteStore();
 const [firstName, setFirstName] = useState("Guest");
 const colors = useThemeColors();
 const [showNotifications, setShowNotifications] = useState(false);
 const [userBookings, setUserBookings] = useState<any[]>([]);
 const [loadingNotifications, setLoadingNotifications] = useState(false);
 const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
 const [dynamicHeroBanners, setDynamicHeroBanners] = useState<any[]>([]);
 const [searchLoading, setSearchLoading] = useState(false);

 useEffect(() => {
    if (showNotifications) {
      setLoadingNotifications(true);
      api.get("/api/bookings/me")
        .then((res: any) => setUserBookings(Array.isArray(res.data) ? res.data : []))
        .catch(console.error)
        .finally(() => setLoadingNotifications(false));
    }
  }, [showNotifications]);

 useEffect(() => {
    const loadUser = async () => {
      try {
        // 1. Fetch active user session from server
        const session = await authApi.getSession();
        if (session?.user?.name) {
          setFirstName(session.user.name.split(" ")[0]);
          await AsyncStorage.setItem("user", JSON.stringify(session.user));
          return;
        }

        // 2. Fallback to local storage if offline
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.name) {
            setFirstName(user.name.split(" ")[0]);
          }
        }
      } catch (e) {
        console.error("Failed to load session user name", e);
      }
    };
    loadUser();
  }, []);

 useEffect(() => {
    const fetchFarmhouses = async () => {
      if (allFarmhouses.length === 0) setLoading(true);
      else setSearchLoading(true);

      try {
        const url = searchQuery 
          ? `${API_URL}/api/farmhouses?search=${encodeURIComponent(searchQuery)}`
          : `${API_URL}/api/farmhouses?limit=20`;
        const res = await fetch(url);
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        
        const activeData = data.filter((f: any) => f.isActive);
        setFeaturedFarmhouses(activeData.filter((f: any) => f.isFeatured));
        setAllFarmhouses(activeData);
      } catch (err) {
        console.error("Failed to fetch farmhouses", err);
      }
      
      try {
        if (dynamicCategories.length === 0) {
          const [catRes, bannerRes] = await Promise.all([
            fetch(`${API_URL}/api/categories`),
            fetch(`${API_URL}/api/hero-banners`)
          ]);
          const catData = await catRes.json();
          const bannerData = await bannerRes.json();
          setDynamicCategories(Array.isArray(catData) ? catData.filter((c: any) => c.isActive) : []);
          setDynamicHeroBanners(Array.isArray(bannerData) ? bannerData.filter((b: any) => b.isActive) : []);
        }
      } catch (err) {
        console.error("Failed to fetch categories or banners", err);
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchFarmhouses();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
 }, [searchQuery]);

 const handleCategoryPress = (filterKey: string) => {
 router.push(`/farmhouse/all?category=${filterKey}`);
 };

 const displayedFarmhouses = useMemo(() => {
 return searchQuery ? allFarmhouses : allFarmhouses.filter(f => !f.isFeatured);
 }, [allFarmhouses, searchQuery]);

 const renderFarmhouseCard = ({ item, isHorizontal = false }: { item: any, isHorizontal?: boolean }) => {
 let displayLocation = item.city ? `${item.city}` : "Unknown Location";

 if (isHorizontal) {
 return (
 <TouchableOpacity 
 onPress={() => router.push(`/farmhouse/${item.id}`)}
 className="bg-surface dark:bg-surface rounded-[28px] overflow-hidden shadow-sm border border-border dark:border-border w-72 mr-4"
 >
 <View className="relative w-full h-44">
 <Image source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }} className="w-full h-full" resizeMode="cover" />
 <View className="absolute top-0 w-full h-full bg-black/10" />
 <TouchableOpacity 
 onPress={() => toggleFavorite(item.id)}
 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
 className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full items-center justify-center"
 >
 <Heart size={14} color={isFavorite(item.id) ? "#f43f5e" : "#FBFBF9"} fill={isFavorite(item.id) ? "#f43f5e" : "transparent"} />
 </TouchableOpacity>
 
 <View className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full flex-row items-center border border-white/20">
 <Star size={12} color="#f59e0b" fill="#f59e0b" />
 <Text className="ml-1 text-white font-[Inter_700Bold] text-[11px]">4.8</Text>
 </View>
 </View>
 <View className="p-4">
 <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface mb-1 tracking-tight" numberOfLines={1}>{item.title}</Text>
 <View className="flex-row items-center mb-3">
 <MapPin size={12} color={colors.textMuted} />
 <Text className="text-xs font-[Inter_500Medium] text-text-muted dark:text-text-muted ml-1 flex-1" numberOfLines={1}>{displayLocation}</Text>
 </View>
 <View className="flex-row items-end border-t border-border dark:border-border pt-3">
 <Text className="text-sm font-[Inter_700Bold] text-success">₹{new Intl.NumberFormat('en-IN').format(Number(item.price12Hours))}</Text>
 <Text className="text-[10px] font-[Inter_500Medium] text-text-muted dark:text-text-muted ml-1 mb-0.5 uppercase tracking-wider">/ 12 hrs</Text>
 </View>
 </View>
 </TouchableOpacity>
 );
 }

 return (
 <TouchableOpacity 
 onPress={() => router.push(`/farmhouse/${item.id}`)}
 className="bg-surface dark:bg-surface rounded-2xl overflow-hidden mb-5 border border-border dark:border-border shadow-sm mx-6"
 >
 <View className="relative w-full h-52">
 <Image source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }} className="w-full h-full" resizeMode="cover" />
 <View className="absolute top-0 w-full h-full bg-black/10" />
 <TouchableOpacity 
 onPress={() => toggleFavorite(item.id)}
 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
 className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full items-center justify-center"
 >
 <Heart size={16} color={isFavorite(item.id) ? "#f43f5e" : "#FBFBF9"} fill={isFavorite(item.id) ? "#f43f5e" : "transparent"} />
 </TouchableOpacity>

 <View className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex-row items-center border border-white/20">
 <Star size={12} color="#f59e0b" fill="#f59e0b" />
 <Text className="ml-1.5 text-white font-[Inter_700Bold] text-xs">4.9</Text>
 </View>
 </View>

 <View className="p-4">
 <View className="flex-row justify-between items-start mb-2">
 <Text className="text-lg font-[Inter_700Bold] text-text-primary dark:text-surface flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
 <Text className="text-base font-[Inter_800ExtraBold] text-success">₹{new Intl.NumberFormat('en-IN').format(Number(item.price12Hours))}</Text>
 </View>

 <View className="flex-row justify-between items-center border-t border-border dark:border-border pt-3">
 <View className="flex-row items-center flex-1">
 <MapPin size={14} color={colors.textMuted} />
 <Text className="text-[13px] font-[Inter_500Medium] text-text-muted dark:text-text-muted ml-1">{displayLocation}</Text>
 </View>
 <Text className="text-[11px] font-[Inter_500Medium] text-text-muted dark:text-text-muted uppercase tracking-wider">Starts at / 12h</Text>
 </View>
 </View>
 </TouchableOpacity>
 );
 };


 return (
    <View className="flex-1 bg-surface dark:bg-surface">
      {loading ? (
        <View className="flex-1 bg-surface dark:bg-surface px-6 pt-12">
          <View className="h-44 bg-border dark:bg-border rounded-3xl mb-6 opacity-40" />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList 
          data={searchLoading ? [] : displayedFarmhouses} 
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderFarmhouseCard({ item, isHorizontal: false })}
          ListEmptyComponent={
            searchLoading ? (
              <View className="px-6 py-4">
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : (
              <View className="px-6">
                <EmptyState
                  type="search"
                  title="No Farmhouses Found"
                  description={`No properties matched "${searchQuery}". Try searching for another location.`}
                  actionText="Clear Search"
                  onAction={() => setSearchQuery("")}
                />
              </View>
            )
          }
          ListHeaderComponent={
            <View>
              {/* Header (Greeting + Favorites + Notification) */}
              <View className="px-6 pt-10 pb-2 flex-row justify-between items-center bg-surface dark:bg-surface">
                <View>
                  <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-xs mb-0.5">Hello, {firstName}</Text>
                  <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-base tracking-tight">Let's find the best farmhouse</Text>
                </View>
                <View className="flex-row items-center space-x-2.5 gap-2.5">
                  <TouchableOpacity 
                    onPress={() => router.push("/favorites")}
                    className="w-9 h-9 bg-surface dark:bg-surface rounded-full items-center justify-center border border-border dark:border-border"
                  >
                    <Heart size={18} color="#f43f5e" fill="#f43f5e" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setShowNotifications(true)}
                    className="w-9 h-9 bg-surface dark:bg-surface rounded-full items-center justify-center border border-border dark:border-border"
                  >
                    <View className="relative">
                      <Bell size={18} color={colors.textPrimary} className="dark:text-text-muted" />
                      <View className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full border-2 border-border dark:border-border" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Header / Hero Section */}
              <ImageBackground 
                source={{ uri: getFullImageUrl(dynamicHeroBanners[0]?.imageUrl) }} 
                className="w-full h-[210px] rounded-b-[32px] overflow-hidden shadow-xl relative"
                imageStyle={{ opacity: 0.85 }}
              >
                <View className="absolute inset-0 bg-black/40 bg-gradient-to-b from-black/20 to-black/90" />
                <View className="absolute inset-x-0 bottom-0 p-5 pt-8 bg-gradient-to-t from-black/80 to-transparent">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-warning font-[Inter_700Bold] uppercase tracking-wider text-[11px]">
                      {dynamicHeroBanners[0]?.subheading || "Premium Getaways"}
                    </Text>
                  </View>
                  <Text className="text-2xl text-white font-[Inter_800ExtraBold] leading-snug mb-1 tracking-tight">
                    {dynamicHeroBanners[0]?.heading || "Find Your Perfect Escape"}
                  </Text>
                  <Text className="text-white/90 font-[Inter_500Medium] mb-3 text-xs max-w-[280px]" numberOfLines={1}>
                    {dynamicHeroBanners[0]?.buttonText || "Discover luxury farmhouses with private pools."}
                  </Text>
                  
                  {/* Search Bar matching theme palette */}
                  <View className="flex-row items-center bg-surface/95 dark:bg-surface/95 backdrop-blur-md pl-4 pr-1 py-1 rounded-full border border-border dark:border-border shadow-lg my-2">
                    <Search size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput 
                      className="flex-1 text-sm text-text-primary dark:text-surface font-[Inter_500Medium] p-0"
                      placeholder="Search by location, pool, turf..."
                      placeholderTextColor={colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1 mr-1">
                        <X size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={() => router.push("/farmhouse/all")}
                      className="w-10 h-10 bg-[#0066CC] rounded-full items-center justify-center shadow-md"
                    >
                      <SlidersHorizontal size={18} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </ImageBackground>

              {/* Categories Pills Row directly below Search Bar */}
              <View className="mt-4 mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }} className="space-x-3">
                  <TouchableOpacity 
                    onPress={() => setActiveCategory(null)}
                    className={`flex-row items-center px-5 py-3 rounded-full mr-2 ${!activeCategory ? 'bg-[#0066CC]' : 'bg-surface dark:bg-surface border border-border dark:border-border shadow-sm'}`}
                  >
                    <Sparkles size={16} color={!activeCategory ? '#FFFFFF' : colors.accentPrimary} style={{ marginRight: 6 }} />
                    <Text className={`font-[Inter_700Bold] text-xs ${!activeCategory ? 'text-white' : 'text-text-primary dark:text-surface'}`}>All Stays</Text>
                  </TouchableOpacity>

                  {(dynamicCategories.length > 0 ? dynamicCategories : CATEGORIES).map((cat) => {
                    const IconComponent = cat.Icon || MapPin;
                    const isSelected = activeCategory === cat.filterKey;
                    return (
                      <TouchableOpacity 
                        key={cat.id} 
                        onPress={() => {
                          if (isSelected) setActiveCategory(null);
                          else setActiveCategory(cat.filterKey);
                        }}
                        className={`flex-row items-center px-4 py-3 rounded-full mr-2 ${isSelected ? 'bg-[#0066CC]' : 'bg-surface dark:bg-surface border border-border dark:border-border shadow-sm'}`}
                      >
                        <IconComponent size={16} color={isSelected ? '#FFFFFF' : (cat.color || colors.accentPrimary)} style={{ marginRight: 6 }} />
                        <Text className={`font-[Inter_700Bold] text-xs ${isSelected ? 'text-white' : 'text-text-primary dark:text-surface'}`}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

 {/* Featured Spaces */}
 {!searchQuery && featuredFarmhouses.length > 0 && (
 <View className="mb-2">
 <View className="px-4 flex-row justify-between items-end mb-4">
 <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface tracking-tight">Featured Spaces</Text>
 <TouchableOpacity onPress={() => router.push("/farmhouse/all")} className="flex-row items-center mb-1">
 <Text className="text-text-muted font-[Inter_600SemiBold] text-sm mr-1">See All</Text>
 <ChevronRight size={14} color={colors.textMuted} />
 </TouchableOpacity>
 </View>
 <FlatList 
 horizontal
 showsHorizontalScrollIndicator={false}
 data={featuredFarmhouses}
 keyExtractor={(item) => item.id.toString()}
 renderItem={({ item }) => renderFarmhouseCard({ item, isHorizontal: true })}
 contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
 snapToInterval={304}
 decelerationRate="fast"
 />
 </View>
 )}

 {/* Explore All Header */}
 <View className="px-4 mt-4 mb-2">
 <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface tracking-tight">
 {searchQuery ? "Search Results" : "Explore All"}
 </Text>
 </View>
 </View>
  }
  contentContainerStyle={{ paddingBottom: 100 }}
  style={{ paddingHorizontal: 0 }}
/>
)}

      {/* Notifications Modal Overlay */}
      {showNotifications && (
        <View className="absolute inset-0 z-50">
          <TouchableOpacity 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            activeOpacity={1}
            onPress={() => setShowNotifications(false)}
          />
          <View className="absolute bottom-0 w-full bg-surface dark:bg-surface rounded-t-[32px] p-6 shadow-2xl h-[75%]">
            <View className="w-12 h-1.5 bg-border dark:bg-border rounded-full mx-auto mb-6" />
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-[Inter_700Bold] text-text-primary dark:text-surface">Notifications & Stays</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} className="p-2 bg-surface dark:bg-border rounded-full">
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#0066CC" />
              </View>
            ) : userBookings.length > 0 ? (
              <FlatList
                data={userBookings}
                keyExtractor={(b, idx) => (b.id ? String(b.id) : String(idx))}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="bg-surface dark:bg-surface rounded-2xl p-4 mb-3 border border-border dark:border-border flex-row items-center"
                    onPress={() => {
                      setShowNotifications(false);
                      router.push(`/farmhouse/${item.farmhouseId}`);
                    }}
                  >
                    <Image 
                      source={{ uri: getFullImageUrl(item.farmhouse?.photos?.[0] || item.farmhouse?.images?.[0]) }}
                      className="w-16 h-16 rounded-xl mr-3"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-sm" numberOfLines={1}>
                        {item.farmhouse?.title || "Farmhouse Stay"}
                      </Text>
                      <Text className="text-xs text-text-muted mt-0.5">
                        {new Date(item.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(item.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className={`text-[10px] font-[Inter_700Bold] px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'CONFIRMED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          {item.status}
                        </Text>
                        <Text className="text-xs font-[Inter_700Bold] text-text-primary dark:text-surface ml-auto">
                          ₹{item.totalAmount?.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View className="flex-1 items-center justify-center pb-12">
                <View className="w-20 h-20 bg-surface dark:bg-border rounded-full items-center justify-center mb-4">
                  <CalendarCheck size={32} color="#0066CC" />
                </View>
                <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold] text-lg mb-2">No active notifications</Text>
                <Text className="text-text-muted dark:text-text-muted text-center font-[Inter_400Medium] px-6">
                  You don't have any active farmhouse bookings scheduled yet. Start exploring to find your next getaway!
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowNotifications(false)}
                  className="mt-6 bg-[#10B981] px-8 py-3.5 rounded-2xl"
                >
                  <Text className="text-white font-[Inter_700Bold]">Explore Farmhouses</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
