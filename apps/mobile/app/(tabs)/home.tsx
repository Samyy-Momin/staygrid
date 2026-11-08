import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, FlatList, ImageBackground, Dimensions, Modal, Appearance } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, MapPin, Star, Heart, Droplet, Trees, PartyPopper, X, ChevronRight, Tent, Users, Dog, Bell, CalendarCheck, SlidersHorizontal, Sparkles, User, LogOut, Sun, Moon, ShieldCheck } from "lucide-react-native";
import { useFavoriteStore } from "../../lib/store";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeColors } from "../../lib/theme-colors";
import { SkeletonCard } from "../../components/SkeletonCard";
import { EmptyState } from "../../components/EmptyState";
import { LocationPickerModal } from "../../components/LocationPickerModal";
import { ReelCarousel } from "../../components/ReelCarousel";
import { CheckInExperienceModal } from "../../components/CheckInExperienceModal";
import { unregisterPushNotificationsAsync } from "../../lib/notifications";

const CATEGORIES = [
  { id: 1, name: "Location", Icon: MapPin, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "location" },
  { id: 2, name: "Top Rated", Icon: Star, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#F59E0B", filterKey: "sortBy=rating" },
  { id: 3, name: "Turf", Icon: Tent, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#10B981", filterKey: "hasTurf" },
  { id: 4, name: "Big Pools", Icon: Droplet, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#0066CC", filterKey: "hasPool" },
  { id: 5, name: "Couple Friendly", Icon: Users, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f43f5e", filterKey: "isCoupleFriendly" },
  { id: 6, name: "Pet Friendly", Icon: Dog, bg: "bg-surface dark:bg-surface", border: "border-border dark:border-border", color: "#f59e0b", filterKey: "isPetFriendly" },
];

const API_URL = getApiUrl();
const { width } = Dimensions.get("window");

import { api, authApi } from "../../lib/authApi";
import { useCategories } from "../../lib/useCategories";

export default function HomeScreen() {
 const router = useRouter();
 const { categories } = useCategories();
 const [featuredFarmhouses, setFeaturedFarmhouses] = useState<any[]>([]);
 const [allFarmhouses, setAllFarmhouses] = useState<any[]>([]);
 const [showLocationModal, setShowLocationModal] = useState(false);
 const [selectedCity, setSelectedCity] = useState<string | null>(null);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [activeCategory, setActiveCategory] = useState<string | null>(null);
 const { toggleFavorite, isFavorite } = useFavoriteStore();
 const [firstName, setFirstName] = useState("Guest");
 const colors = useThemeColors();
 const [showNotifications, setShowNotifications] = useState(false);
 const [showSidebar, setShowSidebar] = useState(false);
 const [userProfile, setUserProfile] = useState<any>(null);
 const [userNotifications, setUserNotifications] = useState<any[]>([]);
 const [loadingNotifications, setLoadingNotifications] = useState(true);
 const [notificationsAuthError, setNotificationsAuthError] = useState(false);
 const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
 const [dynamicHeroBanners, setDynamicHeroBanners] = useState<any[]>([]);
 const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (showNotifications) {
      setLoadingNotifications(true);
      setNotificationsAuthError(false);
      api.get("/api/notifications/me")
        .then((res: any) => setUserNotifications(Array.isArray(res.data) ? res.data : []))
        .catch((err) => {
          if (err?.message?.includes("Authentication required") || err?.response?.status === 401) {
            setNotificationsAuthError(true);
          }
        })
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
          setUserProfile(session.user);
          await AsyncStorage.setItem("user", JSON.stringify(session.user));
          api.get('/api/notifications/me')
            .then((res: any) => setUserNotifications(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
          return;
        }

        // 2. Fallback to local storage if offline
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserProfile(user);
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

 const [cancelledDeals, setCancelledDeals] = useState<any[]>([]);

 useEffect(() => {
    const fetchFarmhouses = async () => {
      if (allFarmhouses.length === 0) setLoading(true);
      else setSearchLoading(true);

      try {
        let url = `${API_URL}/api/farmhouses?limit=20`;
        if (activeCategory === "sortBy=rating") {
          url += `&sortBy=rating`;
        } else if (activeCategory && activeCategory !== "location") {
          url += `&${activeCategory}=true`;
        }
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
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
        const [catRes, bannerRes, cancelledRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`).catch(() => null),
          fetch(`${API_URL}/api/hero-banners`).catch(() => null),
          fetch(`${API_URL}/api/farmhouses/cancelled-deals`).catch(() => null),
        ]);
        if (catRes) {
          const catData = await catRes.json().catch(() => []);
          setDynamicCategories(Array.isArray(catData) ? catData.filter((c: any) => c.isActive) : []);
        }
        if (bannerRes) {
          const bannerData = await bannerRes.json().catch(() => []);
          setDynamicHeroBanners(Array.isArray(bannerData) ? bannerData.filter((b: any) => b.isActive) : []);
        }
        if (cancelledRes) {
          const cancelledData = await cancelledRes.json().catch(() => []);
          setCancelledDeals(Array.isArray(cancelledData) ? cancelledData : []);
        }
      } catch (err) {
        console.error("Failed to fetch categories, banners, or cancelled deals", err);
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchFarmhouses();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeCategory]);

 const handleCategoryPress = (filterKey: string) => {
 router.push(`/farmhouse/all?category=${filterKey}`);
 };

  const displayedFarmhouses = useMemo(() => {
    let list = searchQuery ? [...allFarmhouses] : allFarmhouses.filter(f => !f.isFeatured);
    if (activeCategory === "hasTurf") {
      list = list.filter((f) => f.hasTurf);
    } else if (activeCategory === "hasPool") {
      list = list.filter((f) => f.hasPool);
    } else if (activeCategory === "isCoupleFriendly") {
      list = list.filter((f) => f.isCoupleFriendly);
    } else if (activeCategory === "isPetFriendly") {
      list = list.filter((f) => f.isPetFriendly);
    } else if (activeCategory === "sortBy=rating") {
      list = [...list].sort((a, b) => (b.avgRating || b.rating || 0) - (a.avgRating || a.rating || 0));
    }
    return list;
  }, [allFarmhouses, searchQuery, activeCategory]);

  const renderFarmhouseCard = ({ item, isHorizontal = false }: { item: any, isHorizontal?: boolean }) => {
    let displayLocation = item.city ? `${item.city}` : "Unknown Location";
    const ratingVal = item.avgRating || item.rating || "5.0";

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
              className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full items-center justify-center border border-white/20"
            >
              <Heart size={14} color={isFavorite(item.id) ? "#f43f5e" : "#FBFBF9"} fill={isFavorite(item.id) ? "#f43f5e" : "transparent"} />
            </TouchableOpacity>
            
            <View className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full flex-row items-center border border-white/20">
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="ml-1 text-white font-[Inter_700Bold] text-[11px]">{ratingVal}</Text>
            </View>
          </View>
          <View className="p-4">
            <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-1 tracking-tight" numberOfLines={1}>{item.title}</Text>
            <View className="flex-row items-center mb-2.5">
              <MapPin size={12} color={colors.textMuted} />
              <Text className="text-xs font-[Inter_500Medium] text-text-muted dark:text-text-muted ml-1 flex-1" numberOfLines={1}>{displayLocation}</Text>
            </View>
            <View className="flex-row items-center justify-between border-t border-border dark:border-border pt-2.5">
              <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">12H Stay Price</Text>
              <Text className="text-base font-[Inter_800ExtraBold] text-[#0066CC]">₹{Number(item.price12Hours || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        onPress={() => router.push(`/farmhouse/${item.id}`)}
        className="bg-surface dark:bg-surface rounded-[28px] overflow-hidden mb-5 border border-border dark:border-border shadow-sm mx-4"
      >
        <View className="relative w-full h-48">
          <Image source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }} className="w-full h-full" resizeMode="cover" />
          <View className="absolute top-0 w-full h-full bg-black/10" />
          <TouchableOpacity 
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full items-center justify-center border border-white/20"
          >
            <Heart size={14} color={isFavorite(item.id) ? "#f43f5e" : "#FBFBF9"} fill={isFavorite(item.id) ? "#f43f5e" : "transparent"} />
          </TouchableOpacity>
          
          <View className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full flex-row items-center border border-white/20">
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text className="ml-1 text-white font-[Inter_700Bold] text-[11px]">{ratingVal}</Text>
          </View>
        </View>
        <View className="p-4">
          <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-1 tracking-tight" numberOfLines={1}>{item.title}</Text>
          <View className="flex-row items-center mb-2.5">
            <MapPin size={12} color={colors.textMuted} />
            <Text className="text-xs font-[Inter_500Medium] text-text-muted dark:text-text-muted ml-1 flex-1" numberOfLines={1}>{displayLocation}</Text>
          </View>
          <View className="flex-row items-center justify-between border-t border-border dark:border-border pt-2.5">
            <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">12H Stay Price</Text>
            <Text className="text-base font-[Inter_800ExtraBold] text-[#0066CC]">₹{Number(item.price12Hours || 0).toLocaleString('en-IN')}</Text>
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View>
            {/* Header (Greeting + User Avatar + Notification) */}
            <View className="px-6 pt-10 pb-2 flex-row justify-between items-center bg-surface dark:bg-surface">
              <View className="flex-row items-center space-x-3 gap-3">
                <TouchableOpacity 
                  onPress={() => setShowSidebar(true)}
                  className="w-10 h-10 bg-[#0066CC]/15 dark:bg-[#0066CC]/25 rounded-full items-center justify-center border border-[#0066CC]/30"
                >
                  <User size={20} color="#0066CC" />
                </TouchableOpacity>
                <View>
                  <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-xs mb-0.5">Hello, {firstName}</Text>
                  <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-base tracking-tight">Let's find the best farmhouse</Text>
                </View>
              </View>
              <View className="flex-row items-center space-x-2.5 gap-2.5">
                <TouchableOpacity 
                  onPress={() => setShowNotifications(true)}
                  className="w-9 h-9 bg-surface dark:bg-surface rounded-full items-center justify-center border border-border dark:border-border"
                >
                  <View className="relative">
                    <Bell size={18} color={colors.textPrimary} className="dark:text-text-muted" />
                    {userNotifications.some((notification) => !notification.readAt) && <View className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-danger border border-surface" />}
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
                
                {/* Search Bar navigating to dedicated search screen */}
                <TouchableOpacity 
                  onPress={() => router.push("/search")}
                  className="flex-row items-center bg-black/65 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/30 shadow-lg my-2"
                >
                  <Search size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                  <Text className="flex-1 text-sm text-white/90 font-[Inter_600SemiBold]">
                    {searchQuery || "Search location, pool, turf..."}
                  </Text>
                  <View className="w-8 h-8 bg-[#0066CC] rounded-full items-center justify-center shadow-md">
                    <SlidersHorizontal size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
              </View>
            </ImageBackground>

            {/* Circular Category Avatars Row */}
            <View className="mt-5 mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {(categories || []).map((cat, idx) => {
                  const IconComponent = cat.Icon || MapPin;
                  const isLocationPill = cat.filterKey === "location";
                  const isSelected = activeCategory === cat.filterKey;

                  return (
                    <TouchableOpacity 
                      key={cat.id || `cat-${idx}`} 
                      onPress={() => {
                        if (isLocationPill) {
                          setShowLocationModal(true);
                        } else {
                          router.push(`/farmhouse/all?category=${cat.filterKey}`);
                        }
                      }}
                      className="items-center mr-4 w-20"
                    >
                      <View 
                        style={{ width: 68, height: 68, borderRadius: 34 }}
                        className={`border-2 overflow-hidden items-center justify-center bg-surface dark:bg-surface ${
                          isSelected ? 'border-[#0066CC]' : 'border-border dark:border-border'
                        }`}
                      >
                        {cat.imageUrl ? (
                          <Image 
                            source={{ uri: getFullImageUrl(cat.imageUrl) }} 
                            className="w-full h-full rounded-full" 
                            resizeMode="cover" 
                          />
                        ) : (
                          <View className="w-full h-full rounded-full bg-[#0066CC]/10 items-center justify-center">
                            <IconComponent size={24} color="#0066CC" strokeWidth={2} />
                          </View>
                        )}
                      </View>
                      <Text className={`font-[Inter_700Bold] text-xs text-center mt-1.5 ${isSelected ? 'text-[#0066CC]' : 'text-text-primary dark:text-surface'}`} numberOfLines={1}>
                        {isLocationPill && selectedCity ? selectedCity : cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Featured Spaces */}
            {!searchQuery && featuredFarmhouses.length > 0 && (
              <View className="mb-4">
                <View className="px-4 flex-row justify-between items-center mb-3">
                  <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface tracking-tight">Featured Spaces</Text>
                  <TouchableOpacity onPress={() => router.push("/farmhouse/all?category=featured")} className="flex-row items-center">
                    <Text className="text-[#0066CC] font-[Inter_700Bold] text-xs mr-1">See All</Text>
                    <ChevronRight size={14} color="#0066CC" />
                  </TouchableOpacity>
                </View>
                <FlatList 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={featuredFarmhouses}
                  keyExtractor={(item) => `featured-${item.id}`}
                  renderItem={({ item }) => renderFarmhouseCard({ item, isHorizontal: true })}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
                  snapToInterval={304}
                  decelerationRate="normal"
                  scrollEventThrottle={16}
                />
              </View>
            )}

            {/* Instagram Reels Carousel (Replaces Cancellation Deals) */}
            {!searchQuery && <ReelCarousel />}

            {/* Explore All Stays (Horizontal Cards Carousel matching Featured Spaces) */}
            <View className="mb-6 mt-2">
              <View className="px-4 flex-row justify-between items-center mb-3">
                <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface tracking-tight">
                  {searchQuery ? "Search Results" : "Explore All Stays"}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity onPress={() => router.push("/farmhouse/all?category=all")} className="flex-row items-center">
                    <Text className="text-[#0066CC] font-[Inter_700Bold] text-xs mr-1">See All Farmhouses</Text>
                    <ChevronRight size={14} color="#0066CC" />
                  </TouchableOpacity>
                )}
              </View>

              {displayedFarmhouses.length === 0 ? (
                <View className="px-6 py-6 items-center">
                  <EmptyState
                    type="search"
                    title="No Farmhouses Found"
                    description={`No properties matched "${searchQuery}". Try searching for another location.`}
                    actionText="Clear Search"
                    onAction={() => setSearchQuery("")}
                  />
                </View>
              ) : (
                <FlatList 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={displayedFarmhouses}
                  keyExtractor={(item) => `explore-${item.id}`}
                  renderItem={({ item }) => renderFarmhouseCard({ item, isHorizontal: true })}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
                  snapToInterval={304}
                  decelerationRate="normal"
                  scrollEventThrottle={16}
                />
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Notifications Modal Overlay */}
      {showNotifications && (
        <View className="absolute inset-0 z-50">
          <TouchableOpacity 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            activeOpacity={1}
            onPress={() => setShowNotifications(false)}
          />
          <View className="absolute bottom-0 inset-x-0 bg-surface dark:bg-surface rounded-t-[32px] p-6 max-h-[80%] border-t border-border dark:border-border shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#0066CC]/10 rounded-full items-center justify-center mr-3">
                  <Bell size={20} color="#0066CC" />
                </View>
                <View>
                  <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Notifications</Text>
                  <Text className="text-xs text-text-muted font-[Inter_500Medium]">Stay updates & active bookings</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full bg-border/40 dark:bg-border/40 items-center justify-center"
              >
                <X size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <View className="space-y-3 pt-2">
                {[1, 2, 3].map((key) => (
                  <View key={key} className="bg-surface dark:bg-border/40 rounded-2xl p-4 mb-3 border border-border dark:border-border flex-row items-center">
                    <View className="w-16 h-16 rounded-xl bg-border/70 dark:bg-border/60 mr-3" />
                    <View className="flex-1">
                      <View className="w-3/4 h-4 bg-border/70 dark:bg-border/60 rounded mb-2" />
                      <View className="w-1/2 h-3 bg-border/40 dark:bg-border/40 rounded mb-2" />
                      <View className="w-1/3 h-3 bg-border/40 dark:bg-border/40 rounded" />
                    </View>
                  </View>
                ))}
              </View>
            ) : notificationsAuthError ? (
              <View className="flex-1 items-center justify-center pb-12">
                <View className="w-20 h-20 bg-surface dark:bg-border rounded-full items-center justify-center mb-4 border border-border dark:border-border">
                  <Bell size={32} color="#0066CC" />
                </View>
                <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-lg mb-2">Login Required</Text>
                <Text className="text-text-muted dark:text-text-muted text-center font-[Inter_400Medium] px-6 mb-6 text-sm">
                  Please log in to view active notifications and farmhouse stay updates.
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowNotifications(false);
                    router.push("/auth/login");
                  }}
                  className="bg-[#0066CC] px-8 py-3.5 rounded-full"
                >
                  <Text className="text-white font-[Inter_700Bold]">Log In / Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : userBookings.length > 0 ? (
              <FlatList
                data={userBookings}
                keyExtractor={(b, idx) => (b.id ? String(b.id) : String(idx))}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`rounded-2xl p-4 mb-3 border flex-row items-start ${item.readAt ? 'bg-surface border-border' : 'bg-accent-primary/5 border-accent-primary/30'}`}
                    onPress={() => {
                      api.patch('/api/notifications/' + item.id + '/read').catch(() => {});
                      setShowNotifications(false);
                      if (item.data?.bookingId) router.push('/bookings/' + item.data.bookingId);
                    }}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.readAt ? 'bg-border/50' : 'bg-accent-primary/10'}`}>
                      <Bell size={18} color={item.readAt ? colors.textMuted : '#0066CC'} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-sm" numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text className="text-xs text-text-muted mt-1" numberOfLines={3}>
                        {item.body}
                      </Text>
                      <Text className="text-[10px] text-text-muted mt-2">
                        {new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View className="flex-1 items-center justify-center pb-12">
                <View className="w-20 h-20 bg-surface dark:bg-border rounded-full items-center justify-center mb-4">
                  <CalendarCheck size={32} color="#0066CC" />
                </View>
                <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold] text-lg mb-2">No notifications yet</Text>
                <Text className="text-text-muted dark:text-text-muted text-center font-[Inter_400Medium] px-6">
                  Booking updates and reminders will appear here.
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

      {/* Slide-out Sidebar Drawer Modal */}
      <Modal
        visible={showSidebar}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSidebar(false)}
      >
        <View className="flex-1 flex-row bg-black/60 backdrop-blur-md">
          {/* Drawer Panel */}
          <View className="w-[82%] h-full bg-surface dark:bg-surface p-6 shadow-2xl justify-between border-r border-border dark:border-border">
            <View>
              {/* Top Close Button */}
              <View className="flex-row justify-between items-center mb-6 pt-4">
                <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                  Account Menu
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowSidebar(false)}
                  className="p-2 rounded-full bg-border/40 dark:bg-border/40"
                >
                  <X size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* User Profile Card */}
              <View className="flex-row items-center bg-surface dark:bg-border/40 p-4 rounded-2xl mb-6 border border-border dark:border-border">
                <View className="w-14 h-14 bg-[#0066CC] rounded-full items-center justify-center mr-3.5 shadow-md">
                  <Text className="text-white font-[Inter_800ExtraBold] text-xl">
                    {(userProfile?.name || firstName || "G").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface" numberOfLines={1}>
                    {userProfile?.name || firstName || "StayGrid Guest"}
                  </Text>
                  <Text className="text-xs text-text-muted font-[Inter_400Regular]" numberOfLines={1}>
                    {userProfile?.phone || userProfile?.email || "Signed In User"}
                  </Text>
                </View>
              </View>

              {/* Sidebar Action List */}
              <View className="space-y-2">
                <TouchableOpacity 
                  onPress={() => { setShowSidebar(false); router.push("/(tabs)/bookings"); }}
                  className="flex-row items-center p-3.5 rounded-xl bg-surface dark:bg-surface border border-border/60 mb-2"
                >
                  <CalendarCheck size={20} color="#0066CC" style={{ marginRight: 12 }} />
                  <Text className="font-[Inter_600SemiBold] text-text-primary dark:text-surface text-sm flex-1">My Bookings</Text>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => { setShowSidebar(false); router.push("/(tabs)/favorites"); }}
                  className="flex-row items-center p-3.5 rounded-xl bg-surface dark:bg-surface border border-border/60 mb-2"
                >
                  <Heart size={20} color="#f43f5e" style={{ marginRight: 12 }} />
                  <Text className="font-[Inter_600SemiBold] text-text-primary dark:text-surface text-sm flex-1">Saved Wishlist</Text>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => { setShowSidebar(false); router.push("/auth/terms"); }}
                  className="flex-row items-center p-3.5 rounded-xl bg-surface dark:bg-surface border border-border/60 mb-2"
                >
                  <ShieldCheck size={20} color="#10B981" style={{ marginRight: 12 }} />
                  <Text className="font-[Inter_600SemiBold] text-text-primary dark:text-surface text-sm flex-1">Terms & Privacy Policy</Text>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Dark Mode Switch Row */}
                <TouchableOpacity 
                  onPress={() => {
                    const nextScheme = colors.isDark ? 'light' : 'dark';
                    Appearance.setColorScheme(nextScheme);
                  }}
                  className="flex-row items-center justify-between p-3.5 rounded-xl bg-surface dark:bg-surface border border-border/60 mt-4"
                >
                  <View className="flex-row items-center">
                    {colors.isDark ? <Moon size={20} color="#F59E0B" style={{ marginRight: 12 }} /> : <Sun size={20} color="#F59E0B" style={{ marginRight: 12 }} />}
                    <Text className="font-[Inter_600SemiBold] text-text-primary dark:text-surface text-sm">Appearance</Text>
                  </View>
                  <Text className="text-xs font-[Inter_700Bold] text-[#0066CC] uppercase">{colors.isDark ? "Dark Mode" : "Light Mode"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity 
              onPress={async () => {
                setShowSidebar(false);
                try {
                  await unregisterPushNotificationsAsync();
                  await authApi.signOut();
                  await AsyncStorage.removeItem("user");
                  router.replace("/auth/login");
                } catch (e) {
                  router.replace("/auth/login");
                }
              }}
              className="flex-row items-center justify-center p-4 rounded-2xl bg-danger/10 border border-danger/30 mb-4"
            >
              <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="font-[Inter_700Bold] text-danger text-base">Log Out</Text>
            </TouchableOpacity>
          </View>

          {/* Right Backdrop Touch to Close */}
          <TouchableOpacity className="flex-1" onPress={() => setShowSidebar(false)} />
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationModal}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          if (city) {
            router.push(`/farmhouse/all?city=${encodeURIComponent(city)}`);
          } else {
            router.push(`/farmhouse/all`);
          }
        }}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Check-in Day Review Experience Prompt Modal */}
      <CheckInExperienceModal />
    </View>
  );
}
