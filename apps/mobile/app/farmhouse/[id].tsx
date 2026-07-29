import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Platform, Modal, Pressable, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useEffect, useMemo } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar as RNCalendar, DateData } from "react-native-calendars";
import { useFavoriteStore } from "../../lib/store";
import {
  MapPin, Star, Heart, Users, Bed, Wifi, Coffee, Car, Droplet, Tv, Check, Flame, Map as MapIcon, Calendar, ArrowLeft, ExternalLink, Navigation, CheckCircle2, ChevronLeft, ChevronRight, Droplets, Speaker, Mic, Dice5, Phone, Accessibility, Gamepad2, Sparkles, Trees, Target, Grid, Circle, X, Sun, Moon, ShieldCheck
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useThemeColors } from "../../lib/theme-colors";

import { parseISO, format, addDays, eachDayOfInterval, isBefore } from 'date-fns';

const API_URL = getApiUrl();

const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
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
        setCheckOutTime('10:00 AM');
      } else {
        setEndDate(startDate);
        setCheckOutTime('10:00 PM');
      }
    } else if (bookingType === '24H') {
      setEndDate(addDaysToDateStr(startDate, 1));
      setCheckOutTime(slot);
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

            {/* Badges Row */}
            <View className="flex-row items-center flex-wrap gap-2 mb-3">
              <View className="flex-row items-center bg-surface dark:bg-[#1C1C1E] px-3 py-1.5 rounded-full border border-warning/40">
                <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                <Text className="text-text-primary dark:text-white font-[Inter_700Bold] text-xs">4.9 <Text className="text-text-muted font-[Inter_400Regular]">(210)</Text></Text>
              </View>
              <View className="flex-row items-center bg-surface dark:bg-[#1C1C1E] px-3 py-1.5 rounded-full border border-border dark:border-white/10">
                <Users size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text className="text-text-primary dark:text-white font-[Inter_600SemiBold] text-xs">Up to {farmhouse.capacity || 30}</Text>
              </View>
              <View className="flex-row items-center bg-surface dark:bg-[#1C1C1E] px-3 py-1.5 rounded-full border border-border dark:border-white/10">
                <ShieldCheck size={12} color="#10B981" style={{ marginRight: 4 }} />
                <Text className="text-text-primary dark:text-white font-[Inter_600SemiBold] text-xs">Verified Host</Text>
              </View>
            </View>
          </View>

          {/* Core Bento Grid - Row 1 (Stats & Main Price) */}
          <View className="flex-row flex-wrap justify-between mb-3">
            {/* Pricing Bento Block */}
            <View className="w-full bg-surface dark:bg-surface p-4.5 rounded-[24px] mb-3 border border-border dark:border-border">
              <Text className="text-text-primary dark:text-text-muted font-[Inter_700Bold] text-sm mb-3">Pricing Options</Text>
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium]">12 Hours Stay</Text>
                <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-text-primary text-lg">₹{formatPrice(farmhouse.price12Hours)}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium]">24 Hours Stay (Overnight)</Text>
                <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-text-primary text-lg">₹{formatPrice(farmhouse.price24Hours)}</Text>
              </View>
            </View>

            {/* Quick Stats Bento Blocks - Small squares */}
            <View className="w-[48%] bg-surface dark:bg-surface p-4 rounded-[24px] mb-4 items-center justify-center border border-border dark:border-border">
              <View style={{ marginBottom: 8 }}>
                <Users size={24} color="#0066CC" />
              </View>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-lg">{farmhouse.capacity || 0}</Text>
              <Text className="text-[11px] font-[Inter_500Medium] text-text-muted uppercase tracking-wide mt-1">Guests Max</Text>
            </View>

            <View className="w-[48%] bg-surface dark:bg-surface p-4 rounded-[24px] mb-4 items-center justify-center border border-border dark:border-border">
              <View style={{ marginBottom: 8 }}>
                <Bed size={24} color="#0066CC" />
              </View>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-lg">{farmhouse.roomCount || 0}</Text>
              <Text className="text-[11px] font-[Inter_500Medium] text-text-muted uppercase tracking-wide mt-1">Bedrooms</Text>
            </View>
          </View>

          {/* Outdoor Amenities Bento Box */}
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-4 mt-2">Outdoor & Nature</Text>
          <View className="flex-row flex-wrap mb-6 gap-3">
            {farmhouse.hasPool && (
              <View className="w-full bg-surface dark:bg-surface p-5 rounded-[24px] border border-border dark:border-border mb-3">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-surface dark:bg-surface rounded-full items-center justify-center mr-3">
                    <Droplets size={20} color="#0066CC" />
                  </View>
                  <View>
                    <Text className="font-[Inter_700Bold] text-text-primary dark:text-text-primary text-base">Swimming Pool</Text>
                    <Text className="font-[Inter_500Medium] text-text-muted dark:text-text-muted text-xs">Size: {farmhouse.poolSize || 'N/A'} ft</Text>
                  </View>
                </View>
                {farmhouse.poolType && farmhouse.poolType !== 'NONE' && (
                  <View className="bg-surface/60 dark:bg-surface p-3 rounded-xl mt-2">
                    <Text className="font-[Inter_600SemiBold] text-text-primary dark:text-text-muted text-xs">Baby Pool ({farmhouse.poolType === 'ATTACHED' ? 'Attached' : 'Separate'})</Text>
                    <Text className="font-[Inter_500Medium] text-text-muted dark:text-text-muted text-[11px] mt-0.5">Size: {farmhouse.babyPoolSize || 'N/A'} ft</Text>
                  </View>
                )}
              </View>
            )}

            {/* Full-width descriptive rows for outdoor amenities */}
            {farmhouse.hasTurf && (
              <View className="w-full bg-surface dark:bg-surface p-4 rounded-2xl flex-row items-center mb-3 border border-border dark:border-border">
                <View className="w-10 h-10 bg-success dark:bg-surface rounded-full items-center justify-center mr-3">
                  <Check size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="font-[Inter_700Bold] text-text-primary dark:text-text-primary text-base">Turf</Text>
                  <Text className="font-[Inter_500Medium] text-text-muted dark:text-text-muted text-xs mt-0.5">Dedicated sports turf area</Text>
                </View>
              </View>
            )}

            {farmhouse.hasRainDance && (
              <View className="w-full bg-surface dark:bg-surface p-4 rounded-2xl flex-row items-center mb-3 border border-border dark:border-border">
                <View className="w-10 h-10 bg-surface dark:bg-surface rounded-full items-center justify-center mr-3">
                  <Droplet size={20} color="#0066CC" />
                </View>
                <View className="flex-1">
                  <Text className="font-[Inter_700Bold] text-text-primary dark:text-text-primary text-base">Rain Dance</Text>
                  <Text className="font-[Inter_500Medium] text-text-muted dark:text-text-muted text-xs mt-0.5">Music and water setup</Text>
                </View>
              </View>
            )}

            {farmhouse.hasPlayArea && (
              <View className="w-full bg-surface dark:bg-surface p-4 rounded-2xl flex-row items-center mb-3 border border-border dark:border-border">
                <View className="w-10 h-10 bg-warning dark:bg-surface rounded-full items-center justify-center mr-3">
                  <Sparkles size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="font-[Inter_700Bold] text-text-primary dark:text-text-primary text-base">Kids Play Area</Text>
                  <Text className="font-[Inter_500Medium] text-text-muted dark:text-text-muted text-xs mt-0.5">Safe area for children</Text>
                </View>
              </View>
            )}

            {farmhouse.hasGardenArea && (
              <View className="w-full bg-surface dark:bg-surface p-4 rounded-2xl flex-row items-center mb-3 border border-border dark:border-border">
                <View className="w-10 h-10 bg-success dark:bg-surface rounded-full items-center justify-center mr-3">
                  <Trees size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="font-[Inter_700Bold] text-text-primary dark:text-text-primary text-base">Garden Area</Text>
                  <Text className="font-[Inter_500Medium] text-text-muted dark:text-text-muted text-xs mt-0.5">Lush green relaxing space</Text>
                </View>
              </View>
            )}
          </View>

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
            <View className="flex-row justify-between items-center">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Extra Mattresses</Text>
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">{farmhouse.extraMattressCount || 0}</Text>
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
            <Text className="text-text-primary dark:text-text-muted font-[Inter_700Bold] text-sm mb-3">Indoor Games</Text>
            <View className="flex-row flex-wrap gap-2">
              {farmhouse.hasCarom && <PillBadge icon={<Target size={14} color="#0066CC" />} text="Carom" />}
              {farmhouse.hasUno && <PillBadge icon={<Dice5 size={14} color="#0066CC" />} text="UNO" />}
              {farmhouse.hasChess && <PillBadge icon={<Grid size={14} color="#0066CC" />} text="Chess" />}
              {farmhouse.has8BallPool && <PillBadge icon={<Circle size={14} color="#0066CC" />} text="8 Ball Pool" />}
              {farmhouse.hasTeenPatti && <PillBadge icon={<Dice5 size={14} color="#0066CC" />} text="Teen Patti" />}
              {(!farmhouse.hasCarom && !farmhouse.hasUno && !farmhouse.hasTeenPatti && !farmhouse.hasChess && !farmhouse.has8BallPool) && (
                <Text className="font-[Inter_500Medium] text-text-muted text-sm italic">No games listed</Text>
              )}
            </View>
          </View>

          {/* Guest Reviews Section */}
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-4 mt-2">Guest Reviews</Text>
          <View className="mb-8">
            <View className="flex-row items-end mb-6">
              <Text className="text-4xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">{farmhouse.averageRating || '4.8'}</Text>
              <View className="ml-3 mb-1">
                <View className="flex-row items-center mb-0.5">
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                </View>
                <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] text-sm">Based on {farmhouse.reviews?.length || 0} reviews</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 pb-2" contentContainerStyle={{ paddingRight: 32 }}>
              <View className="w-72 bg-surface dark:bg-surface p-5 rounded-3xl border border-border dark:border-border shadow-sm mr-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-surface dark:bg-surface items-center justify-center mr-3">
                      <Text className="text-accent-primary dark:text-text-muted font-[Inter_700Bold]">S</Text>
                    </View>
                    <View>
                      <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface">Sanjay M.</Text>
                      <Text className="text-xs text-text-muted">October 2023</Text>
                    </View>
                  </View>
                  <View className="flex-row bg-surface dark:bg-surface px-2 py-1 rounded-full items-center">
                    <Star size={10} color="#F59E0B" fill="#F59E0B" />
                    <Text className="text-warning dark:text-text-muted text-[10px] font-[Inter_700Bold] ml-1">5.0</Text>
                  </View>
                </View>
                <Text className="text-text-muted dark:text-text-muted text-sm leading-relaxed" numberOfLines={4}>
                  "Amazing experience! The pool was very clean and the turf was great for our night cricket match. The caretaker was very helpful and the food arranged was delicious. Highly recommended for a group of 15-20 people."
                </Text>
              </View>

              {farmhouse.reviews && farmhouse.reviews.length > 0 ? (
                farmhouse.reviews.slice(0, 2).map((review: any, index: number) => (
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
                <Text className="text-text-muted font-[Inter_500Medium] p-4">No reviews yet.</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              className="mt-4 py-4.5 bg-surface dark:bg-surface rounded-xl items-center border border-border dark:border-border"
              onPress={() => router.push(`/reviews/${id}`)}
            >
              <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">Show all {farmhouse.reviews?.length || 0} reviews</Text>
            </TouchableOpacity>
          </View>

          {/* Settings & Contact */}
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-4">Need to Know</Text>
          <View className="mb-6 space-y-3">
            <View className="bg-surface dark:bg-surface px-6 py-4 rounded-[20px] flex-row justify-between items-center border border-border dark:border-border mb-3">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] flex-1">Token Booking Amount</Text>
              <Text className="font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-lg ml-4">₹{formatPrice(farmhouse.tokenAmount)}</Text>
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
              <Text className="text-text-muted dark:text-text-muted font-[Inter_500Medium] mb-3">Host Contact Numbers</Text>
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
                  <Text className="text-text-muted font-[Inter_400Regular] italic">None provided</Text>
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
        <View className="flex-1 bg-black/60 justify-end">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCalendar(false)}
          />
          <View className="bg-surface dark:bg-surface rounded-t-[32px] p-6 shadow-2xl h-[85%] z-10">
            <View className="w-12 h-1.5 bg-border dark:bg-border rounded-full mx-auto mb-4" />

            {/* Modal Header with Back Button and Close Button */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                {wizardStep > 1 && (
                  <TouchableOpacity
                    onPress={() => setWizardStep((prev) => (prev - 1) as any)}
                    className="mr-3 p-2 bg-surface dark:bg-border rounded-full border border-border dark:border-border"
                  >
                    <ChevronLeft size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                )}
                <View>
                  <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                    {wizardStep === 1 && "Step 1: Stay Type"}
                    {wizardStep === 2 && "Step 2: Check-in Date"}
                    {wizardStep === 3 && "Step 3: Check-in Time"}
                    {wizardStep === 4 && "Step 4: Review Booking"}
                  </Text>
                  <Text className="text-xs text-text-muted font-[Inter_500Medium]">
                    {wizardStep === 1 && "Choose how long you plan to stay"}
                    {wizardStep === 2 && "Select your check-in date on calendar"}
                    {wizardStep === 3 && "Select your check-in time slot"}
                    {wizardStep === 4 && "Review your stay details & proceed"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCalendar(false)} className="p-2 bg-surface dark:bg-border rounded-full border border-border dark:border-border">
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              {/* STEP 1: Select Booking Type Cards */}
              {wizardStep === 1 && (
                <View className="mt-2 space-y-3">
                  <TouchableOpacity
                    onPress={() => {
                      setBookingType('12H');
                      setWizardStep(2);
                    }}
                    className="p-4 bg-surface dark:bg-border/60 rounded-2xl border border-border dark:border-border flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-10 h-10 rounded-xl bg-[#0066CC]/10 items-center justify-center mr-3">
                        <Sun size={20} color="#0066CC" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">12 Hours Day Stay</Text>
                        <Text className="text-xs text-text-muted font-[Inter_500Medium]">Daytime party & pool access</Text>
                        <Text className="text-xs font-[Inter_700Bold] text-[#0066CC] mt-0.5">₹{formatPrice(farmhouse.price12Hours)} / 12 hrs</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setBookingType('24H');
                      setWizardStep(2);
                    }}
                    className="p-4 bg-surface dark:bg-border/60 rounded-2xl border border-border dark:border-border flex-row items-center justify-between mt-3"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-10 h-10 rounded-xl bg-[#0066CC]/10 items-center justify-center mr-3">
                        <Moon size={20} color="#0066CC" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">24 Hours Full Stay</Text>
                        <Text className="text-xs text-text-muted font-[Inter_500Medium]">Overnight & full day stay</Text>
                        <Text className="text-xs font-[Inter_700Bold] text-[#0066CC] mt-0.5">₹{formatPrice(farmhouse.price24Hours)} / 24 hrs</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setBookingType('CUSTOM');
                      setWizardStep(2);
                    }}
                    className="p-4 bg-surface dark:bg-border/60 rounded-2xl border border-border dark:border-border flex-row items-center justify-between mt-3"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-10 h-10 rounded-xl bg-[#0066CC]/10 items-center justify-center mr-3">
                        <Calendar size={20} color="#0066CC" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">Custom Multi-Day Stay</Text>
                        <Text className="text-xs text-text-muted font-[Inter_500Medium]">Select flexible check-in & check-out dates</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: Pick Check-in Date */}
              {wizardStep === 2 && (
                <View className="mt-1">
                  <Text className="text-xs font-[Inter_700Bold] text-[#0066CC] uppercase tracking-wider mb-2">
                    {bookingType === 'CUSTOM' ? "Select Start & End Dates" : `Select Check-in Date (${bookingType})`}
                  </Text>
                  <CustomCalendar
                    startDate={startDate}
                    endDate={endDate}
                    onDayPress={(dayStr) => handleDayPress({ dateString: dayStr } as any)}
                    minDate={minDate}
                    colors={colors}
                    bookedDates={bookedDates}
                  />
                  {startDate && (
                    <View className="mt-4 p-4 bg-surface dark:bg-border/40 rounded-2xl border border-border flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">Selected Check-in Date</Text>
                        <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface">{formatDisplayDate(startDate)}</Text>
                      </View>
                      {bookingType !== 'CUSTOM' && (
                        <TouchableOpacity
                          onPress={() => setWizardStep(3)}
                          className="px-5 py-2.5 bg-[#10B981] rounded-xl flex-row items-center"
                        >
                          <Text className="text-white font-[Inter_700Bold] text-xs mr-1">Next: Select Time</Text>
                          <ChevronRight size={16} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* STEP 3: Pick Check-in Time Slot */}
              {wizardStep === 3 && (
                <View className="mt-2">
                  <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">
                    Select Check-in Time Slot for {formatDisplayDate(startDate)}
                  </Text>
                  <Text className="text-xs text-text-muted mb-4">
                    {bookingType === '12H' ? "Choose morning or night check-in" : "Choose your 24H check-in time"}
                  </Text>

                  {loadingSlots ? (
                    <ActivityIndicator size="small" color="#0066CC" />
                  ) : availableSlots.length === 0 ? (
                    <Text className="text-danger font-[Inter_500Medium] text-sm py-4">No time slots available for this date.</Text>
                  ) : (
                    <View className="space-y-3">
                      {availableSlots.map((slot) => {
                        const isNightSlot = slot.includes("10:00 PM") || slot.includes("22:00");
                        const calculatedCheckout = bookingType === '12H' 
                          ? (isNightSlot ? `${formatDisplayDate(addDaysToDateStr(startDate!, 1))} at 10:00 AM (Next Morning)` : `${formatDisplayDate(startDate!)} at 10:00 PM (Same Night)`)
                          : `${formatDisplayDate(addDaysToDateStr(startDate!, 1))} at ${slot}`;

                        return (
                          <TouchableOpacity
                            key={slot}
                            onPress={() => handleSelectSlot(slot)}
                            className="p-4 bg-surface dark:bg-border/60 rounded-2xl border-2 border-border mb-3 flex-row items-center justify-between"
                          >
                            <View>
                              <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface">Check-in Time: {slot}</Text>
                              <Text className="text-xs text-text-muted mt-1">Check-out: <Text className="font-[Inter_700Bold] text-[#0066CC]">{calculatedCheckout}</Text></Text>
                            </View>
                            <ChevronRight size={20} color="#0066CC" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* STEP 4: Review Trip Summary & Proceed */}
              {wizardStep === 4 && (
                <View className="mt-2">
                  <View className="p-5 bg-surface dark:bg-border/50 rounded-3xl border border-border dark:border-border mb-4">
                    <Text className="text-xs font-[Inter_700Bold] text-[#0066CC] uppercase tracking-widest mb-3">Booking Summary</Text>

                    <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-border/60">
                      <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">Stay Type</Text>
                      <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">
                        {bookingType === '12H' ? '12 Hours Stay' : bookingType === '24H' ? '24 Hours Stay' : 'Custom Multi-Day Stay'}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-border/60">
                      <View>
                        <Text className="text-[10px] font-[Inter_600SemiBold] text-text-muted uppercase">Check-in</Text>
                        <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">{formatDisplayDate(startDate)}</Text>
                        <Text className="text-xs text-[#0066CC] font-[Inter_600SemiBold]">{selectedSlot || '10:00 AM'}</Text>
                      </View>
                      <View className="w-px h-8 bg-border" />
                      <View className="items-end">
                        <Text className="text-[10px] font-[Inter_600SemiBold] text-text-muted uppercase">Check-out</Text>
                        <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">{formatDisplayDate(endDate)}</Text>
                        <Text className="text-xs text-[#0066CC] font-[Inter_600SemiBold]">{checkOutTime || selectedSlot || '10:00 AM'}</Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center pt-1">
                      <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">Stay Amount</Text>
                      <Text className="text-lg font-[Inter_800ExtraBold] text-[#10B981]">
                        ₹{formatPrice(bookingType === '12H' ? farmhouse.price12Hours : farmhouse.price24Hours)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="py-4 bg-[#10B981] rounded-2xl items-center shadow-md mb-6"
                    onPress={() => {
                      const defaultCapacity = farmhouse?.includedGuests || farmhouse?.maxIncludedGuests || farmhouse?.capacity || 20;
                      setPendingNavigation(`/checkout/${id}?start=${startDate}&end=${endDate}&type=${bookingType}&time=${selectedSlot || '10:00 AM'}&adults=${defaultCapacity}&children=0`);
                      setShowCalendar(false);
                    }}
                  >
                    <Text className="text-white font-[Inter_700Bold] text-base">Proceed to Confirm & Pay →</Text>
                  </TouchableOpacity>
                </View>
              )}
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