import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  TrendingUp,
  Building2,
  Calendar,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  Flame,
  Lightbulb,
  BellRing,
  Zap,
  Award,
} from "lucide-react-native";
import { api } from "../../lib/authApi";
import { useThemeColors } from "../../lib/theme-colors";
import { mixpanel } from "../../lib/mixpanel";

export default function MobileOwnerAnalyticsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [period, setPeriod] = useState<string>("30d");
  const [selectedFarmhouseId, setSelectedFarmhouseId] = useState<string>("ALL");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const q = new URLSearchParams();
      q.append("period", period);
      if (selectedFarmhouseId && selectedFarmhouseId !== "ALL") {
        q.append("farmhouseId", selectedFarmhouseId);
      }
      const res = await api.get(`/bookings/owner-analytics?${q.toString()}`);
      setData(res.data);
      await mixpanel.track("owner_analytics_viewed", {
        period,
        farmhouse_id: selectedFarmhouseId,
        platform: "mobile",
      });
    } catch (e) {
      console.error("Failed to load owner analytics on mobile:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [period, selectedFarmhouseId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const properties = data?.properties || [];
  const health = data?.businessHealth;
  const overview = data?.overview;
  const revenue = data?.revenueAnalytics;
  const cancellation = data?.cancellationAnalytics;
  const performance = data?.performance;
  const occupancy = data?.occupancy;
  const growth = data?.growth;

  const formatCurrency = (val: number | undefined) => {
    return `₹${(val || 0).toLocaleString("en-IN")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      {/* Header */}
      <View className="px-5 py-3 border-b border-border dark:border-border flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-surface dark:bg-border/40 rounded-full border border-border"
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
              Business Analytics
            </Text>
            <Text className="text-[11px] text-text-muted font-[Inter_500Medium]">
              Owner Performance Dashboard
            </Text>
          </View>
        </View>

        {/* Property Switcher */}
        {properties.length > 1 && (
          <TouchableOpacity
            onPress={() => {
              const nextId =
                selectedFarmhouseId === "ALL" ? properties[0]?.id : "ALL";
              setSelectedFarmhouseId(nextId);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex-row items-center gap-1"
          >
            <Building2 size={12} color={colors.accentPrimary} />
            <Text className="text-[11px] font-[Inter_700Bold] text-accent-primary">
              {selectedFarmhouseId === "ALL" ? "All Properties" : "1 Property"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Filter Pills */}
      <View className="px-5 py-2.5 bg-surface dark:bg-surface border-b border-border/50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "this_month", label: "This Month" },
            { id: "3m", label: "Last 3 Months" },
          ].map((p) => {
            const active = period === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? "bg-accent-primary border-accent-primary"
                    : "bg-surface dark:bg-border/30 border-border"
                }`}
              >
                <Text
                  className={`text-xs font-[Inter_600SemiBold] ${
                    active ? "text-white" : "text-text-muted"
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center p-8">
          <ActivityIndicator size="large" color={colors.accentPrimary} />
          <Text className="text-xs text-text-muted font-[Inter_500Medium] mt-3">
            Loading business metrics...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* SECTION 1: BUSINESS HEALTH HERO */}
          <View className="p-4 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 space-y-2">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={14} color={colors.accentPrimary} />
              <Text className="text-xs font-[Inter_700Bold] text-accent-primary uppercase tracking-wider">
                Business Health Pulse
              </Text>
            </View>
            <Text className="text-sm font-[Inter_600SemiBold] text-text-primary dark:text-surface leading-relaxed">
              {health?.narrative}
            </Text>

            {health?.alert && (
              <View className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex-row items-center gap-2 mt-1">
                <AlertTriangle size={14} color="#D97706" />
                <Text className="text-xs font-[Inter_600SemiBold] text-amber-800 dark:text-amber-300 flex-1">
                  {health.alert}
                </Text>
              </View>
            )}
          </View>

          {/* SECTION 2: 2x3 KEY METRIC CARDS */}
          <View className="space-y-2">
            <Text className="text-xs font-[Inter_700Bold] uppercase tracking-wider text-text-muted">
              Overview (2x3 Grid)
            </Text>

            <View className="flex-row gap-3">
              {/* Card 1: Revenue */}
              <View className="flex-1 p-3.5 rounded-2xl bg-surface dark:bg-border/30 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Revenue</Text>
                  <Text className="text-xs">💰</Text>
                </View>
                <Text className="text-base font-[Inter_800ExtraBold] text-[#10B981] mt-1.5">
                  {formatCurrency(overview?.totalRevenue)}
                </Text>
                <Text className="text-[9px] text-text-muted mt-0.5">Net retained</Text>
              </View>

              {/* Card 2: Total Bookings */}
              <View className="flex-1 p-3.5 rounded-2xl bg-surface dark:bg-border/30 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Bookings</Text>
                  <Text className="text-xs">📅</Text>
                </View>
                <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mt-1.5">
                  {overview?.totalBookings}
                </Text>
                <Text className="text-[9px] text-text-muted mt-0.5">Total placed</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              {/* Card 3: Completed */}
              <View className="flex-1 p-3.5 rounded-2xl bg-surface dark:bg-border/30 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Completed</Text>
                  <Text className="text-xs">✅</Text>
                </View>
                <Text className="text-base font-[Inter_800ExtraBold] text-[#10B981] mt-1.5">
                  {overview?.completedBookings}
                </Text>
                <Text className="text-[9px] text-text-muted mt-0.5">Guests finished</Text>
              </View>

              {/* Card 4: Cancelled */}
              <View className="flex-1 p-3.5 rounded-2xl bg-surface dark:bg-border/30 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Cancelled</Text>
                  <Text className="text-xs">❌</Text>
                </View>
                <Text className="text-base font-[Inter_800ExtraBold] text-[#EF4444] mt-1.5">
                  {overview?.cancelledBookings}
                </Text>
                <Text className="text-[9px] text-text-muted mt-0.5">{cancellation?.cancellationRate}% rate</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              {/* Card 5: Upcoming */}
              <View className="flex-1 p-3.5 rounded-2xl bg-surface dark:bg-border/30 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Upcoming</Text>
                  <Text className="text-xs">⏳</Text>
                </View>
                <Text className="text-base font-[Inter_800ExtraBold] text-accent-primary mt-1.5">
                  {overview?.upcomingBookings}
                </Text>
                <Text className="text-[9px] text-text-muted mt-0.5">Future arrivals</Text>
              </View>

              {/* Card 6: Occupancy */}
              <View className="flex-1 p-3.5 rounded-2xl bg-surface dark:bg-border/30 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">Occupancy</Text>
                  <Text className="text-xs">📊</Text>
                </View>
                <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mt-1.5">
                  {overview?.occupancyRate}%
                </Text>
                <Text className="text-[9px] text-text-muted mt-0.5">{occupancy?.bookedNights}/{occupancy?.totalNights} nights</Text>
              </View>
            </View>
          </View>

          {/* SECTION 3: REVENUE & CASH BREAKDOWN */}
          <View className="p-4 rounded-2xl bg-surface dark:bg-border/20 border border-border space-y-3">
            <Text className="text-xs font-[Inter_700Bold] uppercase tracking-wider text-text-muted">
              Revenue & Cash Accounting
            </Text>

            <View className="space-y-2 pt-1">
              <View className="flex-row justify-between items-center py-1 border-b border-border/40">
                <Text className="text-xs text-text-primary dark:text-surface font-[Inter_500Medium]">Booking Value</Text>
                <Text className="text-xs font-[Inter_700Bold] text-text-primary dark:text-surface">
                  {formatCurrency(revenue?.totalBookingValue)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1 border-b border-border/40">
                <Text className="text-xs text-[#10B981] font-[Inter_500Medium]">Amount Collected</Text>
                <Text className="text-xs font-[Inter_700Bold] text-[#10B981]">
                  {formatCurrency(revenue?.amountCollected)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1 border-b border-border/40">
                <Text className="text-xs text-[#F59E0B] font-[Inter_500Medium]">Due at Check-in</Text>
                <Text className="text-xs font-[Inter_700Bold] text-[#F59E0B]">
                  {formatCurrency(revenue?.pendingPayments)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1 border-b border-border/40">
                <Text className="text-xs text-[#EF4444] font-[Inter_500Medium]">Refunds Issued</Text>
                <Text className="text-xs font-[Inter_700Bold] text-[#EF4444]">
                  -{formatCurrency(revenue?.refundsIssued)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2">
                <Text className="text-xs font-[Inter_700Bold] text-emerald-800 dark:text-emerald-300">
                  Net Earnings Retained
                </Text>
                <Text className="text-sm font-[Inter_800ExtraBold] text-emerald-600">
                  {formatCurrency(revenue?.netRevenue)}
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 4: CANCELLATIONS & SMART REBOOKED DATES */}
          <View className="p-4 rounded-2xl bg-surface dark:bg-border/20 border border-border space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-[Inter_700Bold] uppercase tracking-wider text-text-muted">
                Cancellation Insights
              </Text>
              <Text className="text-xs font-[Inter_700Bold] text-[#EF4444]">
                {cancellation?.cancellationRate}% Rate
              </Text>
            </View>

            {cancellation?.smartRebookedCount > 0 && (
              <View className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Text className="text-xs font-[Inter_700Bold] text-emerald-700 dark:text-emerald-300">
                  🎯 {cancellation.smartRebookedCount} Cancelled Dates Were Rebooked!
                </Text>
              </View>
            )}

            <View className="flex-row gap-2 pt-1">
              <View className="flex-1 p-2.5 rounded-xl bg-surface dark:bg-border/30 border border-border">
                <Text className="text-[10px] text-text-muted">Fees Kept</Text>
                <Text className="text-xs font-[Inter_700Bold] text-[#10B981] mt-0.5">
                  {formatCurrency(cancellation?.cancellationFeesRetained)}
                </Text>
              </View>
              <View className="flex-1 p-2.5 rounded-xl bg-surface dark:bg-border/30 border border-border">
                <Text className="text-[10px] text-text-muted">True Lost</Text>
                <Text className="text-xs font-[Inter_700Bold] text-[#EF4444] mt-0.5">
                  {formatCurrency(cancellation?.potentialLostRevenue)}
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 5: WEEKEND VS WEEKDAY DEMAND */}
          <View className="p-4 rounded-2xl bg-surface dark:bg-border/20 border border-border space-y-2">
            <Text className="text-xs font-[Inter_700Bold] uppercase tracking-wider text-text-muted">
              Weekend vs Weekday Split
            </Text>

            <View className="h-4 w-full rounded-lg overflow-hidden flex-row bg-border/40 mt-1">
              <View
                style={{ width: `${performance?.weekdayVsWeekend?.weekendPercent || 50}%` }}
                className="bg-accent-primary h-full justify-center items-center"
              />
              <View
                style={{ width: `${performance?.weekdayVsWeekend?.weekdayPercent || 50}%` }}
                className="bg-amber-500 h-full justify-center items-center"
              />
            </View>

            <View className="flex-row justify-between text-[11px] pt-1">
              <Text className="text-xs font-[Inter_600SemiBold] text-accent-primary">
                Weekend: {performance?.weekdayVsWeekend?.weekendPercent}% ({performance?.weekdayVsWeekend?.weekendCount})
              </Text>
              <Text className="text-xs font-[Inter_600SemiBold] text-amber-500">
                Weekday: {performance?.weekdayVsWeekend?.weekdayPercent}% ({performance?.weekdayVsWeekend?.weekdayCount})
              </Text>
            </View>
          </View>

          {/* SECTION 6: MINI OCCUPANCY MATRIX */}
          <View className="p-4 rounded-2xl bg-surface dark:bg-border/20 border border-border space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-[Inter_700Bold] uppercase tracking-wider text-text-muted">
                Calendar Gap Watcher
              </Text>
              <Text className="text-xs font-[Inter_700Bold] text-emerald-600">
                {occupancy?.bookedNights} Booked | {occupancy?.unbookedNights} Open
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-1.5 pt-1">
              {occupancy?.calendarDays?.slice(0, 21).map((d: any) => {
                const isBooked = d.status === "BOOKED";
                const isBlocked = d.status === "BLOCKED";
                const isCancelled = d.status === "CANCELLED";
                const dayNum = d.date.split("-")[2];

                let bg = "bg-surface dark:bg-border/30 border-border";
                let textCol = "text-text-muted";
                if (isBooked) {
                  bg = "bg-emerald-500/20 border-emerald-500/40";
                  textCol = "text-emerald-700 dark:text-emerald-300 font-[Inter_700Bold]";
                } else if (isBlocked) {
                  bg = "bg-amber-500/20 border-amber-500/40";
                  textCol = "text-amber-700 dark:text-amber-300 font-[Inter_700Bold]";
                } else if (isCancelled) {
                  bg = "bg-rose-500/20 border-rose-500/40";
                  textCol = "text-rose-700 dark:text-rose-300 font-[Inter_700Bold]";
                }

                return (
                  <View
                    key={d.date}
                    className={`w-9 h-9 rounded-xl border justify-center items-center ${bg}`}
                  >
                    <Text className={`text-[10px] ${textCol}`}>{dayNum}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* SECTION 7: PHASE 3 GROWTH & OPTIMIZATION TOOLS */}
          {/* Underperforming Gap Watcher */}
          {growth?.underperformingAlerts && growth.underperformingAlerts.length > 0 && (
            <View className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <View className="flex-row items-center gap-2">
                <BellRing size={16} color="#E11D48" />
                <Text className="text-xs font-[Inter_800ExtraBold] text-rose-700 dark:text-rose-400">
                  Upcoming Date Alert 🚨
                </Text>
              </View>
              {growth.underperformingAlerts.map((alert: any, idx: number) => (
                <View key={idx} className="space-y-1 pt-1">
                  <Text className="text-xs font-[Inter_700Bold] text-text-primary dark:text-surface">
                    {alert.title}
                  </Text>
                  <Text className="text-[11px] text-text-muted leading-relaxed">
                    {alert.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Guest Retention & Repeat Customers */}
          <View className="p-4 rounded-2xl bg-surface dark:bg-border/20 border border-border space-y-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Award size={16} color="#10B981" />
                <Text className="text-xs font-[Inter_700Bold] text-text-primary dark:text-surface">
                  Guest Retention
                </Text>
              </View>
              <Text className="text-xs font-[Inter_800ExtraBold] text-emerald-600">
                {growth?.repeatCustomers?.repeatGuestRate}% Repeat Rate
              </Text>
            </View>

            <View className="flex-row justify-between text-xs text-text-muted pt-1">
              <Text className="text-[11px] text-text-muted">
                New: {growth?.repeatCustomers?.newGuestsCount || 0}
              </Text>
              <Text className="text-[11px] text-emerald-600 font-[Inter_600SemiBold]">
                Repeat: {growth?.repeatCustomers?.repeatGuestsCount || 0}
              </Text>
            </View>

            {growth?.repeatCustomers?.topLoyalGuests?.length > 0 && (
              <View className="space-y-2 pt-2 border-t border-border/40">
                <Text className="text-[10px] font-[Inter_700Bold] uppercase tracking-wider text-text-muted">
                  Top Returning Guests
                </Text>
                {growth.repeatCustomers.topLoyalGuests.slice(0, 3).map((g: any, i: number) => (
                  <View key={i} className="flex-row justify-between items-center py-1">
                    <Text className="text-xs font-[Inter_600SemiBold] text-text-primary dark:text-surface">
                      {g.name} ({g.visits} stays)
                    </Text>
                    <Text className="text-xs font-[Inter_700Bold] text-emerald-600">
                      {formatCurrency(g.totalSpent)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
