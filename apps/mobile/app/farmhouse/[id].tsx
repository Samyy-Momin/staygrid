import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Platform, Modal, Pressable, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useEffect, useMemo, useCallback } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar as RNCalendar, DateData } from "react-native-calendars";
import { useFavoriteStore } from "../../lib/store";
import {
  MapPin, Star, Heart, Users, Bed, Wifi, Coffee, Car, Droplet, Tv, Check, Flame, Map as MapIcon, Calendar, ArrowLeft, ExternalLink, Navigation, CheckCircle2, ChevronLeft, ChevronRight, Droplets, Speaker, Mic, Dice5, Phone, Accessibility, Gamepad2, Sparkles, Trees, Target, Grid, Circle, X, Sun, Moon, ShieldCheck, Play, Film
} from "lucide-react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useThemeColors } from "../../lib/theme-colors";
import { mixpanel } from "../../lib/mixpanel";

import { parseISO, format, addDays, eachDayOfInterval, isBefore } from 'date-fns';

const API_URL = getApiUrl();

const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

const formatUtcDateString = (date: Date): string => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

const addDaysToDateStr = (dateStr: string, days: number): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + days));
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

const formatDisplayDate = (dateStr: string | null): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "Add Date";
  const [y, m, d] = dateStr.split('-').map(Number);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[m - 1]} ${d}`;
};

export default function FarmhouseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [farmhouse, setFarmhouse] = useState<any>(null);
  const [nearbyFarmhouses, setNearbyFarmhouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchFarmhouse = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/api/farmhouses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFarmhouse(data);

      const nearbyRes = await fetch(`${API_URL}/api/farmhouses?limit=10`).catch(() => null);
      if (nearbyRes?.ok) {
        const nearbyData = await nearbyRes.json();
        const list = Array.isArray(nearbyData.data) ? nearbyData.data : (Array.isArray(nearbyData) ? nearbyData : []);
        setNearbyFarmhouses(list.filter((f: any) => f.id !== id));
      }
    } catch (err) {
      setError("Could not load farmhouse details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchFarmhouse();
    }, [fetchFarmhouse])
  );

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [bookingType, setBookingType] = useState<'12H' | '24H' | 'CUSTOM' | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  useEffect(() => {
    if (id && showCalendar) {
      fetch(`${API_URL}/api/bookings/booked-dates?farmhouseId=${id}`)
        .then(res => res.json())
        .then(data => setBookedDates(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error fetching booked dates:", err));
    }
  }, [id, showCalendar]);

  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const isFavorite = useFavoriteStore((state) => state.isFavorite(id as string));
  const colors = useThemeColors();

  const handleOpenModal = () => {
    setWizardStep(1);
    setBookingType(null);
    setStartDate(null);
    setEndDate(null);
    setSelectedSlot(null);
    setCheckOutTime(null);
    setAvailableSlots([]);
    setShowCalendar(true);
  };

  useEffect(() => {
    const fetchFarmhouse = async () => {
      try {
        const res = await fetch(`${API_URL}/api/farmhouses/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFarmhouse(data);

        // Mixpanel Event Tracking
        mixpanel.track("farmhouse_viewed", {
          farmhouse_id: id,
          farmhouse_title: data?.title,
          city: data?.city,
          state: data?.state,
          price_12h: data?.price12Hours,
          price_24h: data?.price24Hours,
          has_pool: data?.hasPool,
          has_turf: data?.hasTurf,
        });

        // Silent Event Logging for Marketing Analytics
        fetch(`${API_URL}/api/admin/marketing/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farmhouseId: id, eventType: "VIEW_FARMHOUSE" }),
        }).catch(() => null);

        const nearbyRes = await fetch(`${API_URL}/api/farmhouses?limit=10`).catch(() => null);
        if (nearbyRes?.ok) {
          const nearbyData = await nearbyRes.json();
          const list = Array.isArray(nearbyData.data) ? nearbyData.data : (Array.isArray(nearbyData) ? nearbyData : []);
          setNearbyFarmhouses(list.filter((f: any) => f.id !== id));
        }
      } catch (err) {
        setError("Could not load farmhouse details.");
      } finally {
        setLoading(false);
      }
    };
    fetchFarmhouse();
  }, [id]);

  // Fetch availability when startDate or bookingType changes in step 3
  useEffect(() => {
    if (!showCalendar || !startDate || !id || !bookingType || bookingType === 'CUSTOM' || wizardStep !== 3) {
      return;
    }
    let active = true;
    setLoadingSlots(true);
    fetch(`${API_URL}/api/bookings/availability?farmhouseId=${id}&date=${startDate}&type=${bookingType}`)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        const slots = Array.isArray(data) ? data : [];
        setAvailableSlots(slots);
      })
      .catch(err => { if (active) console.error("Error fetching slots:", err); })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [startDate, bookingType, showCalendar, id, wizardStep]);

  useEffect(() => {
    if (!showCalendar && pendingNavigation) {
      if (Platform.OS !== 'ios') {
        const url = pendingNavigation;
        setPendingNavigation(null);
        router.push(url as any);
      }
    }
  }, [showCalendar, pendingNavigation, router]);

  const openNativeMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${farmhouse.latitude},${farmhouse.longitude}`;
    Linking.openURL(url);
  };

  const formatPrice = (price: string | number) => {
    if (!price) return '0';
    return new Intl.NumberFormat('en-IN').format(Number(price));
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    if (!startDate) return;

    if (bookingType === '12H') {
      if (slot.includes('10:00 PM') || slot.includes('22:00')) {
        setEndDate(addDaysToDateStr(startDate, 1));
        setCheckOutTime('9:00 AM'); // 11 Hours Stay (10 PM to 9 AM)
      } else {
        setEndDate(startDate);
        setCheckOutTime('9:00 PM'); // 11 Hours Stay (10 AM to 9 PM)
      }
    } else if (bookingType === '24H') {
      setEndDate(addDaysToDateStr(startDate, 1));
      if (slot.includes('10:00 AM')) {
        setCheckOutTime('9:00 AM'); // 23 Hours Stay (10 AM to 9 AM next day)
      } else if (slot.includes('10:00 PM')) {
        setCheckOutTime('9:00 PM'); // 23 Hours Stay (10 PM to 9 PM next day)
      } else {
        setCheckOutTime(slot);
      }
    }
    setWizardStep(4);
  };

  const handleDayPress = (day: DateData) => {
    const selected = day.dateString;
    console.log(`[BOOKING_DEBUG] Day pressed: ${selected}, step: ${wizardStep}, mode: ${bookingType}`);

    if (bookingType === 'CUSTOM') {
      if (!startDate || (startDate && endDate)) {
        setStartDate(selected);
        setEndDate(null);
      } else if (selected <= startDate) {
        setStartDate(selected);
        setEndDate(null);
      } else {
        setEndDate(selected);
        setWizardStep(4);
      }
    } else {
      setStartDate(selected);
      setAvailableSlots([]);
      setLoadingSlots(true);
      setWizardStep(3);
    }
  };

  const markedDates = useMemo(() => {
    if (!startDate) return {};
    const marked: Record<string, any> = {};

    if (!endDate || startDate === endDate) {
      marked[startDate] = { startingDay: true, endingDay: true, color: colors.accentBlue, textColor: 'white' };
      return marked;
    }

    let curr = startDate;
    let guard = 0;
    while (curr && curr <= endDate && guard < 90) {
      if (curr === startDate) {
        marked[curr] = { startingDay: true, color: colors.accentBlue, textColor: 'white' };
      } else if (curr === endDate) {
        marked[curr] = { endingDay: true, color: colors.accentBlue, textColor: 'white' };
      } else {
        marked[curr] = { color: colors.isDark ? '#1E293B' : '#E0F2FE', textColor: colors.accentBlue };
      }
      if (curr === endDate) break;
      curr = addDaysToDateStr(curr, 1);
      guard++;
    }
    return marked;
  }, [startDate, endDate, colors]);

  const minDate = useMemo(() => getTodayStr(), []);

  const calendarTheme = useMemo(() => ({
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: colors.textMuted,
    selectedDayBackgroundColor: colors.accentBlue,
    selectedDayTextColor: '#FBFBF9',
    todayTextColor: colors.accentBlue,
    dayTextColor: colors.textPrimary,
    textDisabledColor: colors.border,
    dotColor: colors.accentBlue,
    monthTextColor: colors.textPrimary,
    indicatorColor: colors.accentBlue,
    textDayFontFamily: 'Inter_500Medium',
    textMonthFontFamily: 'Inter_700Bold',
    textDayHeaderFontFamily: 'Inter_600SemiBold',
  }), [colors]);

  if (loading) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface items-center justify-center">
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  if (error || !farmhouse) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface items-center justify-center">
        <Text className="text-text-muted font-[Inter_500Medium]">{error || "Farmhouse not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 bg-accent-primary rounded-full">
          <Text className="text-white font-[Inter_600SemiBold]">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullAddress = [farmhouse.streetAddress, farmhouse.city, farmhouse.state, farmhouse.postalCode, farmhouse.country].filter(Boolean).join(", ");
  const bhkString = `${farmhouse.roomCount} BHK Farmhouse`;

  return (
    <View className="flex-1 bg-surface dark:bg-surface">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Full-bleed Header Image with Dynamic Photo Badge (Image 2) */}
        <View className="relative w-full h-80 bg-surface">
          <Image
            source={{ uri: getFullImageUrl(farmhouse.photos?.[0]) }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute top-0 w-full h-full bg-black/10" />

          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} className="flex-row justify-between px-4 pt-2">
            <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 bg-surface/20 dark:bg-black/40 backdrop-blur-xl rounded-full items-center justify-center border border-white/20">
              <ChevronLeft size={24} color="#FBFBF9" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleFavorite(id as string)}
              className="w-11 h-11 bg-surface/20 dark:bg-black/40 backdrop-blur-xl rounded-full items-center justify-center border border-white/20"
            >
              <Heart size={20} color={isFavorite ? "#f43f5e" : "#FBFBF9"} fill={isFavorite ? "#f43f5e" : "transparent"} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Dynamic Photo Index Badge (Only rendered if > 1 photo) */}
          {Array.isArray(farmhouse.photos) && farmhouse.photos.length > 1 && (
            <View className="absolute bottom-12 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex-row items-center border border-white/20">
              <Text className="text-white text-xs font-[Inter_700Bold]">1 / {farmhouse.photos.length}</Text>
            </View>
          )}
        </View>

        {/* Content Container (matching Image 2) */}
        <View className="px-5 py-6 bg-surface dark:bg-surface -mt-8 rounded-t-[2.5rem]">
          {/* Header & Quick Intro */}
          <View className="mb-2">
            <View className="flex-row items-center mb-1">
              <MapPin size={13} color="#0066CC" style={{ marginRight: 4 }} />
              <Text className="text-[#0066CC] font-[Inter_700Bold] text-xs uppercase tracking-widest">
                {[farmhouse.city, farmhouse.state].filter(Boolean).join(", ") || 'ALIBAUG, KONKAN COAST'}
              </Text>
            </View>
            <Text className="text-3xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface leading-tight mb-2.5 tracking-tight">
              {farmhouse.title}
            </Text>

            {/* Badges Row - Unified sleek grey borders */}
            <View className="flex-row items-center flex-wrap gap-2 mb-3">
              <View className="flex-row items-center bg-surface dark:bg-surface px-3 py-1.5 rounded-full border border-border dark:border-border">
                <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-xs">4.9 <Text className="text-text-muted font-[Inter_400Regular]">(210)</Text></Text>
              </View>
              <View className="flex-row items-center bg-surface dark:bg-surface px-3 py-1.5 rounded-full border border-border dark:border-border">
                <Users size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold] text-xs">Up to {farmhouse.capacity || 30}</Text>
              </View>
              <View className="flex-row items-center bg-surface dark:bg-surface px-3 py-1.5 rounded-full border border-border dark:border-border">
                <ShieldCheck size={12} color="#10B981" style={{ marginRight: 4 }} />
                <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold] text-xs">Verified Host</Text>
              </View>
            </View>
          </View>

          {/* Core Bento Grid - Row 1 (Stats & Main Price) */}
          <View className="flex-row flex-wrap justify-between mb-3">
            {/* Pricing Bento Block */}
            <View className="w-full bg-surface dark:bg-surface p-4 rounded-[24px] mb-3 border border-border dark:border-border shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-text-primary dark:text-surface font-[Inter_800ExtraBold] text-base">Pricing Options</Text>
                <View className="bg-[#0066CC]/10 px-2.5 py-1 rounded-full border border-[#0066CC]/20">
                  <Text className="text-[#0066CC] font-[Inter_700Bold] text-[10px] uppercase tracking-wider">Best Value Rates</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-border/40 mb-2">
                <View>
                  <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-sm">12 Hours Stay</Text>
                  <Text className="text-text-muted font-[Inter_500Medium] text-xs">Day / Night Slot (10 AM–9 PM or 10 PM–9 AM)</Text>
                </View>
                <Text className="font-[Inter_800ExtraBold] text-[#0066CC] text-lg">₹{formatPrice(farmhouse.price12Hours)}</Text>
              </View>
              <View className="flex-row justify-between items-center py-2">
                <View>
                  <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-sm">24 Hours Stay (Overnight)</Text>
                  <Text className="text-text-muted font-[Inter_500Medium] text-xs">Full Day & Night Access</Text>
                </View>
                <Text className="font-[Inter_800ExtraBold] text-[#10B981] text-lg">₹{formatPrice(farmhouse.price24Hours)}</Text>
              </View>
            </View>

            {/* Quick Stats Bento Blocks - Small squares */}
            <View className="w-[48%] bg-surface dark:bg-surface p-4 rounded-[24px] mb-4 items-center justify-center border border-border dark:border-border">
              <View style={{ marginBottom: 6 }}>
                <Users size={22} color="#0066CC" />
              </View>
              <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-lg">{farmhouse.capacity || 0}</Text>
              <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase tracking-wider mt-0.5">Avg Guests</Text>
            </View>

            <View className="w-[48%] bg-surface dark:bg-surface p-4 rounded-[24px] mb-4 items-center justify-center border border-border dark:border-border">
              <View style={{ marginBottom: 6 }}>
                <Bed size={22} color="#0066CC" />
              </View>
              <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-lg">{farmhouse.roomCount || 0}</Text>
              <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase tracking-wider mt-0.5">Bedrooms</Text>
            </View>
          </View>

          {/* 🎬 Video Tour & Host Reels Section (Private & Instagram Videos) */}
          {Array.isArray(farmhouse.exploreMedia) && farmhouse.exploreMedia.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Film size={18} color="#0066CC" />
                  <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                    Video Tour & Host Reels
                  </Text>
                </View>
                <View className="bg-[#0066CC]/10 px-2.5 py-1 rounded-full border border-[#0066CC]/20">
                  <Text className="text-[#0066CC] font-[Inter_700Bold] text-[10px] uppercase">Official Tour</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {farmhouse.exploreMedia.map((media: any) => (
                  <TouchableOpacity
                    key={media.id}
                    onPress={() => router.push("/explore")}
                    activeOpacity={0.9}
                    className="w-32 h-52 bg-black rounded-2xl overflow-hidden relative border border-border/40 shadow-sm"
                  >
                    <Image source={{ uri: media.thumbnailUrl || media.mediaUrl }} className="w-full h-full object-cover" />
                    <View className="absolute top-2 left-2 bg-black/60 p-1.5 rounded-full border border-white/20">
                      <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                    <View className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                      <Text className="text-[10px] font-bold text-white" numberOfLines={2}>
                        {media.caption || "Watch Video Tour"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Outdoor & Features Section (Strictly 2 Rows Layout) */}
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-3">Outdoor & Features</Text>
          
          {/* Row 1: Swimming Pool */}
          {farmhouse.hasPool ? (
            <View className="w-full bg-surface dark:bg-surface p-4 rounded-[24px] border border-border dark:border-border mb-3 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-[#0066CC]/15 rounded-full items-center justify-center mr-3">
                    <Droplets size={20} color="#0066CC" />
                  </View>
                  <View>
                    <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">Swimming Pool</Text>
                    <Text className="font-[Inter_500Medium] text-text-muted text-xs">Size: {farmhouse.poolSize || '20x15'} ft</Text>
                  </View>
                </View>
                {farmhouse.poolType && farmhouse.poolType !== 'NONE' && (
                  <View className="bg-[#0066CC]/10 px-3 py-1 rounded-full border border-[#0066CC]/20">
                    <Text className="font-[Inter_700Bold] text-[#0066CC] text-[11px]">Baby Pool</Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {/* Row 2: All Outdoor Features Pills in a single horizontal scroll row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ paddingRight: 16 }}>
            {farmhouse.hasTurf && (
              <View className="bg-surface dark:bg-surface px-4 py-3 rounded-2xl flex-row items-center mr-3 border border-border dark:border-border">
                <Check size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-xs">Turf Ground</Text>
              </View>
            )}
            {farmhouse.hasRainDance && (
              <View className="bg-surface dark:bg-surface px-4 py-3 rounded-2xl flex-row items-center mr-3 border border-border dark:border-border">
                <Droplet size={16} color="#0066CC" style={{ marginRight: 6 }} />
                <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-xs">Rain Dance</Text>
              </View>
            )}
            {farmhouse.hasPlayArea && (
              <View className="bg-surface dark:bg-surface px-4 py-3 rounded-2xl flex-row items-center mr-3 border border-border dark:border-border">
                <Sparkles size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-xs">Kids Play Area</Text>
              </View>
            )}
            {farmhouse.hasGardenArea && (
              <View className="bg-surface dark:bg-surface px-4 py-3 rounded-2xl flex-row items-center mr-3 border border-border dark:border-border">
                <Trees size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-xs">Garden Lawn</Text>
              </View>
            )}
            {farmhouse.hasCricket && (
              <View className="bg-surface dark:bg-surface px-4 py-3 rounded-2xl flex-row items-center mr-3 border border-border dark:border-border">
                <Check size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-xs">Cricket Kit</Text>
              </View>
            )}
            {farmhouse.hasBadminton && (
              <View className="bg-surface dark:bg-surface px-4 py-3 rounded-2xl flex-row items-center mr-3 border border-border dark:border-border">
                <Check size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-xs">Badminton Court</Text>
              </View>
            )}
          </ScrollView>

          {/* Indoor Details Bento Box */}
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-4">Indoor Details</Text>
          <View className="bg-surface dark:bg-surface rounded-[24px] p-5 mb-8 border border-border dark:border-border">
            <View className="flex-row flex-wrap justify-between">
              <StatBoxMini label="AC Rooms" value={farmhouse.acRoomCount || 0} />
              <StatBoxMini label="Non-AC" value={farmhouse.nonAcRoomCount || 0} />
              <StatBoxMini label="Halls" value={farmhouse.hallCount || 0} />
              <StatBoxMini label="Balconies" value={farmhouse.balconyCount || 0} />
            </View>
            <View className="h-px bg-surface dark:bg-surface my-4" />
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Single Beds</Text>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">{farmhouse.singleBedCount || 0}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Double Beds</Text>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">{farmhouse.doubleBedCount || 0}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Extra Mattresses</Text>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">{farmhouse.extraMattressCount || 0}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Sofas</Text>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">{farmhouse.sofaCount || 0}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Terraces</Text>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">{farmhouse.terraceCount || 0}</Text>
            </View>
          </View>

          {/* Entertainment & Kitchen (Royal Purple Bento) */}
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-4">Features & Entertainment</Text>
          <View className="w-full bg-surface dark:bg-surface p-5 rounded-[24px] mb-8 border border-border dark:border-border">
            <View className="flex-row flex-wrap gap-2">
              {farmhouse.hasWifi && <PillBadge icon={<Wifi size={14} color="#0066CC" />} text="High-Speed WiFi" />}
              {farmhouse.hasTv && <PillBadge icon={<Tv size={14} color="#0066CC" />} text="Smart TV" />}
              {farmhouse.hasKitchen && <PillBadge icon={<Coffee size={14} color="#0066CC" />} text="Kitchen Access" />}
              {farmhouse.hasFridge && <PillBadge icon={<Droplet size={14} color="#0066CC" />} text="Refrigerator" />}
              {farmhouse.hasRoWater && <PillBadge icon={<Droplet size={14} color="#0066CC" />} text="RO Water Purifier" />}
              {farmhouse.hasGas && <PillBadge icon={<Flame size={14} color="#0066CC" />} text={`Gas Stove ${farmhouse.gasCharge ? `(₹${farmhouse.gasCharge})` : ''}`} />}
              {farmhouse.hasSpeakers && <PillBadge icon={<Speaker size={14} color="#0066CC" />} text="Sound System" />}
              {farmhouse.hasMicrophone && <PillBadge icon={<Mic size={14} color="#0066CC" />} text="Karaoke/Mic" />}
              {farmhouse.hasBbq && <PillBadge icon={<Flame size={14} color="#0066CC" />} text="BBQ Setup" />}
            </View>

            <View className="h-px bg-surface dark:bg-surface my-4" />
            <Text className="text-text-primary dark:text-text-muted font-[Inter_700Bold] text-sm mb-3">Indoor & Outdoor Games</Text>
            <View className="flex-row flex-wrap gap-2">
              {farmhouse.hasCarom && <PillBadge icon={<Target size={14} color="#0066CC" />} text="Carom" />}
              {farmhouse.hasChess && <PillBadge icon={<Grid size={14} color="#0066CC" />} text="Chess" />}
              {farmhouse.has8BallPool && <PillBadge icon={<Circle size={14} color="#0066CC" />} text="8 Ball Pool" />}
              {farmhouse.hasCricket && <PillBadge icon={<Target size={14} color="#0066CC" />} text="Cricket Bat & Ball" />}
              {farmhouse.hasBadminton && <PillBadge icon={<Target size={14} color="#0066CC" />} text="Badminton Set" />}
              {(!farmhouse.hasCarom && !farmhouse.hasChess && !farmhouse.has8BallPool && !farmhouse.hasCricket && !farmhouse.hasBadminton) && (
                <Text className="font-[Inter_500Medium] text-text-muted text-sm italic">No games listed</Text>
              )}
            </View>

            {farmhouse.customAmenities && farmhouse.customAmenities.length > 0 && (
              <>
                <View className="h-px bg-surface dark:bg-surface my-4" />
                <Text className="text-text-primary dark:text-text-muted font-[Inter_700Bold] text-sm mb-3">Additional Custom Amenities</Text>
                <View className="flex-row flex-wrap gap-2">
                  {farmhouse.customAmenities.map((amenity: string, idx: number) => (
                    <PillBadge key={idx} icon={<Sparkles size={14} color="#10B981" />} text={amenity} />
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Guest Reviews Section */}
          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">Guest Reviews</Text>
            <TouchableOpacity
              className="bg-[#10B981] px-4 py-2 rounded-full flex-row items-center"
              onPress={() => router.push({ pathname: "/reviews/new", params: { farmhouseId: id } })}
            >
              <Star size={12} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
              <Text className="text-white font-[Inter_700Bold] text-xs">Write a Review</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            <View className="flex-row items-end mb-6">
              <Text className="text-4xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">{farmhouse.avgRating || farmhouse.averageRating || '4.8'}</Text>
              <View className="ml-3 mb-1">
                <View className="flex-row items-center mb-0.5">
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                </View>
                <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Based on {farmhouse.reviewCount || farmhouse.reviews?.length || 0} reviews</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 pb-2" contentContainerStyle={{ paddingRight: 32 }}>
              {farmhouse.reviews && farmhouse.reviews.length > 0 ? (
                farmhouse.reviews.slice(0, 3).map((review: any, index: number) => (
                  <View key={index} className="w-72 bg-surface dark:bg-surface p-5 rounded-3xl border border-border dark:border-border shadow-sm mr-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-surface dark:bg-surface items-center justify-center mr-3">
                          <Text className="text-accent-primary dark:text-text-muted font-[Inter_700Bold]">
                            {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                        <View>
                          <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface">{review.user?.name || 'Guest User'}</Text>
                          <Text className="text-xs text-text-muted">{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</Text>
                        </View>
                      </View>
                      <View className="flex-row bg-surface dark:bg-surface px-2 py-1 rounded-full items-center">
                        <Star size={10} color="#F59E0B" fill="#F59E0B" />
                        <Text className="text-warning dark:text-text-muted text-[10px] font-[Inter_700Bold] ml-1">{review.rating}</Text>
                      </View>
                    </View>
                    <Text className="text-text-muted dark:text-text-muted text-sm leading-relaxed" numberOfLines={4}>
                      {review.comment}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-text-muted font-[Inter_500Medium] p-4">No reviews yet. Be the first to write a review!</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              className="mt-4 py-4.5 bg-surface dark:bg-surface rounded-xl items-center border border-border dark:border-border"
              onPress={() => router.push(`/reviews/${id}`)}
            >
              <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">Show all {farmhouse.reviewCount || farmhouse.reviews?.length || 0} reviews</Text>
            </TouchableOpacity>
          </View>

          {/* Settings & Contact */}
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-4">Need to Know</Text>
          <View className="mb-6 space-y-3">
            <View className="bg-surface dark:bg-surface px-6 py-4 rounded-[20px] flex-row justify-between items-center border border-border dark:border-border mb-3">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] flex-1">Token Booking Amount</Text>
              <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-lg ml-4">50% Paid Now</Text>
            </View>

            {farmhouse.isWheelchairAccessible && (
              <View className="bg-surface dark:bg-surface px-6 py-4 rounded-[20px] flex-row justify-between items-center border border-border dark:border-border mb-3">
                <View className="flex-row items-center">
                  <Accessibility size={16} color="#10B981" />
                  <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] ml-2">Wheelchair Accessible</Text>
                </View>
                <Text className="font-[Inter_700Bold] text-success dark:text-success">Yes</Text>
              </View>
            )}

            <View className="bg-surface dark:bg-surface px-6 py-4 rounded-[20px] border border-border dark:border-border mb-3">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] mb-1">Property Host & Contact</Text>
              {farmhouse.hostName ? (
                <Text className="font-[Inter_700Bold] text-accent-primary text-sm mb-3">Host: {farmhouse.hostName}</Text>
              ) : null}
              <View className="space-y-2">
                {(farmhouse.contactNumbers || []).map((num: string, idx: number) => (
                  <View key={idx} className="bg-surface dark:bg-surface px-4 py-4 rounded-xl flex-row items-center shadow-sm border border-border dark:border-border mb-2">
                    <View style={{ marginRight: 12 }}>
                      <Phone size={14} color="#0066CC" />
                    </View>
                    <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface">{num}</Text>
                  </View>
                ))}
                {(!farmhouse.contactNumbers || farmhouse.contactNumbers.length === 0) && (
                  <Text className="text-text-muted font-[Inter_400Regular] italic">No public phone numbers provided</Text>
                )}
              </View>
            </View>
          </View>

          {/* Location Map */}
          <View className="mt-2 mb-10">
            <View className="flex-row justify-between items-end mb-4">
              <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">Location Map</Text>
              <TouchableOpacity onPress={openNativeMaps} className="flex-row items-center bg-surface dark:bg-surface px-4 py-2 rounded-full border border-border dark:border-border">
                <ExternalLink size={14} color="#0066CC" />
                <Text className="text-accent-primary dark:text-text-muted font-[Inter_600SemiBold] text-xs ml-1.5">Open Maps</Text>
              </TouchableOpacity>
            </View>
            <View className="h-64 rounded-[2rem] overflow-hidden border border-border dark:border-border shadow-sm relative">
              <WebView
                source={{
                  html: `
 <!DOCTYPE html>
 <html>
 <head>
 <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
 <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
 <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
 <style>
 body { padding: 0; margin: 0; }
 html, body, #map { height: 100%; width: 100%; }
 </style>
 </head>
 <body>
 <div id="map"></div>
 <script>
 var lat = ${Number(farmhouse.latitude) || 18.5204};
 var lng = ${Number(farmhouse.longitude) || 73.8567};
 var map = L.map('map').setView([lat, lng], 13);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
 maxZoom: 19,
 attribution: '© OpenStreetMap'
 }).addTo(map);
 L.marker([lat, lng]).addTo(map).bindPopup('<b>${farmhouse.title || 'Farmhouse'}</b>').openPopup();
 </script>
 </body>
 </html>
 `}}
                style={{ flex: 1 }}
                scrollEnabled={false}
              />
            </View>
          </View>

          {/* More Stays Nearby / Best Farmhouses (Square Cards Carousel) */}
          {nearbyFarmhouses.length > 0 && (
            <View className="mt-6 mb-24">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                  More Stays Nearby
                </Text>
                <TouchableOpacity onPress={() => router.push("/farmhouse/all")}>
                  <Text className="text-[#0066CC] font-[Inter_700Bold] text-xs">See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4" contentContainerStyle={{ paddingRight: 32 }}>
                {nearbyFarmhouses.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/farmhouse/${item.id}`)}
                    className="mr-4 bg-surface dark:bg-border/40 rounded-3xl overflow-hidden border border-border shadow-sm w-48"
                  >
                    <View className="w-48 h-48 relative">
                      <Image
                        source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex-row items-center">
                        <Star size={10} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 3 }} />
                        <Text className="text-white font-[Inter_700Bold] text-[10px]">{item.avgRating || "5.0"}</Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-sm font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-0.5" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-[11px] font-[Inter_500Medium] text-text-muted mb-2" numberOfLines={1}>
                        {item.city || "Bhiwandi"}
                      </Text>
                      <Text className="text-xs font-[Inter_800ExtraBold] text-[#0066CC]">
                        ₹{item.price12Hours?.toLocaleString('en-IN') || 0} <Text className="text-[10px] font-[Inter_500Medium] text-text-muted">/ 12h</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Checkout Bar (100% Opaque Solid Surface) */}
      <View
        className="absolute bottom-0 w-full bg-surface dark:bg-surface border-t border-border dark:border-border px-6 pt-4 flex-row justify-between items-center shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom + 10, 24) }}
      >
        <View>
          <Text className="text-[10px] uppercase tracking-wider font-[Inter_700Bold] text-text-muted dark:text-text-muted mb-0.5">Starts From</Text>
          <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">₹{formatPrice(farmhouse.price12Hours)}</Text>
        </View>
        <TouchableOpacity
          className="bg-[#10B981] px-9 h-14 rounded-2xl shadow-md justify-center items-center"
          onPress={handleOpenModal}
        >
          <Text className="text-white font-[Inter_700Bold] text-base">Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Calendar Modal Overlay (4-Step Guided Wizard) */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
        onDismiss={() => {
          if (Platform.OS === 'ios' && pendingNavigation) {
            const url = pendingNavigation;
            setPendingNavigation(null);
            router.push(url as any);
          }
        }}
      >
        <View className="flex-1 bg-black/65 justify-end">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCalendar(false)}
          />
          <View className="bg-surface dark:bg-surface rounded-t-[36px] p-6 shadow-2xl h-[90%] z-10 border-t border-white/10">
            {/* Top Drag Bar Handle */}
            <View className="w-12 h-1.5 bg-border dark:bg-border rounded-full mx-auto mb-4 opacity-80" />

            {/* Simplified 1-Screen Booking Header */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                    Select Stay & Date
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Pick your stay type, check-in date, and preferred time slot
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowCalendar(false)} className="p-2.5 bg-surface dark:bg-border rounded-full border border-border">
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Stay Type Pill Selector Header */}
              <View className="flex-row bg-surface dark:bg-border/40 p-1.5 rounded-2xl border border-border">
                <TouchableOpacity
                  onPress={() => {
                    setBookingType('12H');
                    if (startDate) setEndDate(null);
                  }}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${bookingType === '12H' ? 'bg-[#0066CC]' : 'bg-transparent'}`}
                >
                  <Sun size={15} color={bookingType === '12H' ? 'white' : colors.textMuted} style={{ marginRight: 4 }} />
                  <Text className={`font-[Inter_700Bold] text-xs ${bookingType === '12H' ? 'text-white' : 'text-text-muted'}`}>12H Day</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setBookingType('24H');
                    if (startDate) setEndDate(addDaysToDateStr(startDate, 1));
                  }}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${bookingType === '24H' ? 'bg-[#0066CC]' : 'bg-transparent'}`}
                >
                  <Moon size={15} color={bookingType === '24H' ? 'white' : colors.textMuted} style={{ marginRight: 4 }} />
                  <Text className={`font-[Inter_700Bold] text-xs ${bookingType === '24H' ? 'text-white' : 'text-text-muted'}`}>24H Full</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setBookingType('CUSTOM');
                  }}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${bookingType === 'CUSTOM' ? 'bg-[#0066CC]' : 'bg-transparent'}`}
                >
                  <Calendar size={15} color={bookingType === 'CUSTOM' ? 'white' : colors.textMuted} style={{ marginRight: 4 }} />
                  <Text className={`font-[Inter_700Bold] text-xs ${bookingType === 'CUSTOM' ? 'text-white' : 'text-text-muted'}`}>Multi-Day</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Interactive Calendar */}
              <View className="mb-4">
                <CustomCalendar
                  startDate={startDate}
                  endDate={endDate}
                  onDayPress={(dayStr) => {
                    handleDayPress({ dateString: dayStr } as any);
                    if (!selectedSlot) setSelectedSlot('10:00 AM');
                  }}
                  minDate={minDate}
                  colors={colors}
                  bookedDates={bookedDates}
                />
              </View>

              {/* Weekend Rate Banner Badge */}
              {startDate && (() => {
                const isWeekendDay = new Date(startDate).getDay() === 0 || new Date(startDate).getDay() === 6;
                const effectivePrice = isWeekendDay 
                  ? (bookingType === '12H' ? (farmhouse.weekendPrice12Hours || farmhouse.price12Hours) : (farmhouse.weekendPrice24Hours || farmhouse.price24Hours))
                  : (bookingType === '12H' ? farmhouse.price12Hours : farmhouse.price24Hours);

                if (!isWeekendDay) return null;
                return (
                  <View className="mb-4 p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex-row items-center">
                    <Sparkles size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                    <View className="flex-1">
                      <Text className="text-xs font-[Inter_800ExtraBold] text-[#F59E0B]">Weekend Special Rate Applied</Text>
                      <Text className="text-xs font-[Inter_600SemiBold] text-text-primary dark:text-surface">
                        Saturday/Sunday Rate: ₹{formatPrice(effectivePrice)}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Grouped Available Time Slots Grid */}
              {startDate && (
                <View className="mt-2 mb-6">
                  <Text className="text-xs font-[Inter_800ExtraBold] text-[#0066CC] uppercase tracking-wider mb-2">
                    Available Check-in Time Slots
                  </Text>
                  
                  {loadingSlots ? (
                    <ActivityIndicator size="small" color="#0066CC" className="py-4" />
                  ) : (
                    <View className="space-y-4">
                      {/* Day Slots Group */}
                      <View>
                        <Text className="text-xs font-[Inter_700Bold] text-text-muted mb-2 flex-row items-center">
                          ☀️ Day Check-in Slots (Morning / Afternoon)
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {['10:00 AM', '11:00 AM', '12:00 PM'].map((slot) => {
                            const isSelected = selectedSlot === slot || (!selectedSlot && slot === '10:00 AM');
                            return (
                              <TouchableOpacity
                                key={slot}
                                onPress={() => setSelectedSlot(slot)}
                                className={`px-4 py-3 rounded-2xl border-2 flex-row items-center gap-1.5 ${
                                  isSelected 
                                    ? 'bg-[#0066CC]/15 border-[#0066CC]' 
                                    : 'bg-surface dark:bg-border/40 border-border'
                                }`}
                              >
                                {isSelected && <Check size={14} color="#0066CC" />}
                                <Text className={`text-xs font-[Inter_700Bold] ${isSelected ? 'text-[#0066CC]' : 'text-text-primary dark:text-surface'}`}>
                                  {slot}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Evening & Night Slots Group */}
                      <View className="mt-3">
                        <Text className="text-xs font-[Inter_700Bold] text-text-muted mb-2 flex-row items-center">
                          🌙 Evening & Night Slots
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {['04:00 PM', '06:00 PM', '10:00 PM'].map((slot) => {
                            const isSelected = selectedSlot === slot;
                            return (
                              <TouchableOpacity
                                key={slot}
                                onPress={() => setSelectedSlot(slot)}
                                className={`px-4 py-3 rounded-2xl border-2 flex-row items-center gap-1.5 ${
                                  isSelected 
                                    ? 'bg-[#0066CC]/15 border-[#0066CC]' 
                                    : 'bg-surface dark:bg-border/40 border-border'
                                }`}
                              >
                                {isSelected && <Check size={14} color="#0066CC" />}
                                <Text className={`text-xs font-[Inter_700Bold] ${isSelected ? 'text-[#0066CC]' : 'text-text-primary dark:text-surface'}`}>
                                  {slot}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Instant Sticky Checkout Bar */}
              {startDate && (() => {
                const numNights = (startDate && endDate && endDate > startDate)
                  ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
                  : 1;

                const isWeekendDay = new Date(startDate).getDay() === 0 || new Date(startDate).getDay() === 6;
                const basePrice = bookingType === '12H'
                  ? (isWeekendDay ? (farmhouse.weekendPrice12Hours || farmhouse.price12Hours) : farmhouse.price12Hours)
                  : (isWeekendDay ? (farmhouse.weekendPrice24Hours || farmhouse.price24Hours) : farmhouse.price24Hours);

                const totalCalc = bookingType === 'CUSTOM' ? (farmhouse.price24Hours || farmhouse.price12Hours || 0) * numNights : (basePrice || 0);
                const tokenCalc = bookingType === 'CUSTOM' ? totalCalc : Math.round(totalCalc * 0.5);

                return (
                  <View className="mt-2 p-5 bg-surface dark:bg-border/60 rounded-3xl border border-border shadow-md space-y-4">
                    <View className="flex-row justify-between items-center pb-3 border-b border-border">
                      <View>
                        <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Selected Details</Text>
                        <Text className="text-sm font-[Inter_800ExtraBold] text-text-primary dark:text-surface mt-0.5">
                          {formatDisplayDate(startDate)} • {selectedSlot || '10:00 AM'}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Total Amount</Text>
                        <Text className="text-lg font-[Inter_800ExtraBold] text-[#10B981]">₹{formatPrice(totalCalc)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      className="py-4 bg-[#10B981] rounded-2xl items-center shadow-lg flex-row justify-center"
                      onPress={() => {
                        const defaultCapacity = farmhouse?.includedGuests || farmhouse?.maxIncludedGuests || farmhouse?.capacity || 20;
                        setPendingNavigation(`/checkout/${id}?start=${startDate}&end=${endDate || startDate}&type=${bookingType}&time=${selectedSlot || '10:00 AM'}&adults=${defaultCapacity}&children=0`);
                        setShowCalendar(false);
                      }}
                    >
                      <Text className="text-white font-[Inter_800ExtraBold] text-base mr-1">
                        Confirm & Pay Token (₹{formatPrice(tokenCalc)}) →
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper Components
function BentoBadge({ text, bg, textClass, icon }: { text: string, bg: string, textClass: string, icon: React.ReactNode }) {
  return (
    <View className={`px-4 py-4 rounded-2xl flex-row items-center ${bg}`}>
      <View className="mr-2">{icon}</View>
      <Text className={`font-[Inter_700Bold] text-sm ${textClass}`}>{text}</Text>
    </View>
  );
}

function PillBadge({ text, icon }: { text: string, icon: React.ReactNode }) {
  return (
    <View className="px-3.5 py-2 rounded-full border border-border dark:border-border bg-surface dark:bg-border flex-row items-center mr-2 mb-2">
      <View style={{ marginRight: 6 }}>{icon}</View>
      <Text className="font-[Inter_600SemiBold] text-xs text-text-primary dark:text-surface">{text}</Text>
    </View>
  );
}

function CustomCalendar({
  startDate,
  endDate,
  onDayPress,
  minDate,
  colors,
  bookedDates = [],
}: {
  startDate: string | null;
  endDate: string | null;
  onDayPress: (dateStr: string) => void;
  minDate: string;
  colors: any;
  bookedDates?: string[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    daysArray.push(dayStr);
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <View className="w-full my-2">
      {/* Month Header & Controls */}
      <View className="flex-row justify-between items-center mb-4 px-2">
        <TouchableOpacity onPress={prevMonth} className="p-2 bg-surface dark:bg-border rounded-full border border-border dark:border-border">
          <ChevronLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface">{monthName}</Text>
        <TouchableOpacity onPress={nextMonth} className="p-2 bg-surface dark:bg-border rounded-full border border-border dark:border-border">
          <ChevronRight size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Titles */}
      <View className="flex-row mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">{day}</Text>
          </View>
        ))}
      </View>

      {/* Grid of Days */}
      <View className="flex-row flex-wrap">
        {daysArray.map((dayStr, idx) => {
          if (!dayStr) {
            return <View key={`empty-${idx}`} className="w-[14.28%] h-11" />;
          }

          const isPast = dayStr < minDate;
          const isBooked = bookedDates.includes(dayStr);
          const isDisabled = isPast || isBooked;

          const isStart = dayStr === startDate;
          const isEnd = dayStr === endDate;
          const isBetween = startDate && endDate && dayStr > startDate && dayStr < endDate;

          let bgStyle = "";
          let textStyle = "text-text-primary dark:text-surface font-[Inter_500Medium]";

          if (isBooked) {
            bgStyle = "bg-danger/10 rounded-full border border-danger/30";
            textStyle = "text-danger font-[Inter_700Bold] line-through";
          } else if (isStart && isEnd) {
            bgStyle = "bg-[#0066CC] rounded-full";
            textStyle = "text-white font-[Inter_700Bold]";
          } else if (isStart) {
            bgStyle = "bg-[#0066CC] rounded-l-full";
            textStyle = "text-white font-[Inter_700Bold]";
          } else if (isEnd) {
            bgStyle = "bg-[#0066CC] rounded-r-full";
            textStyle = "text-white font-[Inter_700Bold]";
          } else if (isBetween) {
            bgStyle = "bg-[#0066CC]/20";
            textStyle = "text-[#0066CC] font-[Inter_700Bold]";
          }

          return (
            <TouchableOpacity
              key={dayStr}
              disabled={isDisabled}
              onPress={() => onDayPress(dayStr)}
              className="w-[14.28%] h-11 items-center justify-center p-0.5"
            >
              <View className={`w-full h-full items-center justify-center ${bgStyle} ${isPast ? "opacity-30" : ""}`}>
                <Text className={`text-xs ${textStyle}`}>
                  {parseInt(dayStr.split("-")[2], 10)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Calendar Legend */}
      <View className="flex-row justify-center items-center gap-4 mt-4 pt-3 border-t border-border/60">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#0066CC] mr-1.5" />
          <Text className="text-[11px] font-[Inter_600SemiBold] text-text-muted">Selected</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-danger/20 border border-danger/40 mr-1.5" />
          <Text className="text-[11px] font-[Inter_600SemiBold] text-danger">Booked</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-surface border border-border mr-1.5" />
          <Text className="text-[11px] font-[Inter_600SemiBold] text-text-muted">Available</Text>
        </View>
      </View>
    </View>
  );
}

function StatBoxMini({ label, value }: { label: string, value: string | number }) {
  return (
    <View className="w-[22%] items-center mb-2">
      <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-lg mb-0.5">{value}</Text>
      <Text className="text-[10px] font-[Inter_600SemiBold] text-text-muted dark:text-text-muted text-center leading-tight">{label}</Text>
    </View>
  );
}