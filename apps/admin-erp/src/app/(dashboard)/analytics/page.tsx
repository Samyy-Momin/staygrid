"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/mixpanel";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  AlertTriangle,
  Sparkles,
  Building2,
  CalendarDays,
  ShieldCheck,
  RefreshCw,
  Sun,
  Flame,
  Lightbulb,
  ArrowUpRight,
  ChevronDown,
  BellRing,
  Zap,
  Award,
} from "lucide-react";

export default function OwnerAnalyticsPage() {
  const [selectedFarmhouseId, setSelectedFarmhouseId] = useState<string>("ALL");
  const [period, setPeriod] = useState<string>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const queryParams = new URLSearchParams();
  queryParams.append("period", period);
  if (selectedFarmhouseId && selectedFarmhouseId !== "ALL") {
    queryParams.append("farmhouseId", selectedFarmhouseId);
  }
  if (period === "custom" && customStart && customEnd) {
    queryParams.append("startDate", customStart);
    queryParams.append("endDate", customEnd);
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["owner-analytics", selectedFarmhouseId, period, customStart, customEnd],
    queryFn: async () => {
      const res = await api.get(`/bookings/owner-analytics?${queryParams.toString()}`);
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      trackEvent("owner_analytics_viewed", {
        period,
        farmhouse_id: selectedFarmhouseId,
        platform: "web",
      });
    }
  }, [data, period, selectedFarmhouseId]);

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
    <div className="space-y-6 pb-16 font-sans animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          HEADER & GLOBAL FILTERS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-[Inter_800ExtraBold] text-primary tracking-tight">
              Owner Analytics
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted mt-1">
            Real-time business performance, revenue, and occupancy insights for your farmhouses.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Selector */}
          {properties.length > 0 && (
            <div className="relative">
              <select
                value={selectedFarmhouseId}
                onChange={(e) => setSelectedFarmhouseId(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 text-xs font-[Inter_600SemiBold] bg-surface border border-border rounded-xl text-primary outline-none focus:ring-1 focus:ring-accent-primary shadow-sm"
              >
                <option value="ALL">All Properties ({properties.length})</option>
                {properties.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Quick Date Range Pills */}
          <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-sm">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "this_month", label: "This Month" },
              { id: "3m", label: "3 Months" },
              { id: "custom", label: "Custom" },
            ].map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 text-xs font-[Inter_600SemiBold] rounded-lg transition-all ${
                    active
                      ? "bg-accent-primary text-white shadow-sm"
                      : "text-muted hover:text-primary hover:bg-surface"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Date Pickers Drawer (when 'custom' is active) */}
      {period === "custom" && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xs font-[Inter_600SemiBold] text-muted">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-surface border border-border text-primary text-xs px-3 py-2 rounded-xl outline-none focus:border-accent-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-[Inter_600SemiBold] text-muted">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-surface border border-border text-primary text-xs px-3 py-2 rounded-xl outline-none focus:border-accent-primary"
            />
          </div>
          <span className="text-[11px] text-muted italic">
            Select both dates to filter analytics across your custom date range.
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LOADING SKELETON
      ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-surface border border-border rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-surface border border-border rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-surface border border-border rounded-2xl" />
            <div className="h-64 bg-surface border border-border rounded-2xl" />
          </div>
        </div>
      ) : properties.length === 0 ? (
        /* Empty State: No Farmhouses */
        <div className="p-16 border border-border border-dashed rounded-3xl text-center flex flex-col items-center bg-surface shadow-sm">
          <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-accent-primary" />
          </div>
          <h3 className="text-lg font-[Inter_700Bold] text-primary mb-1">No Properties Found</h3>
          <p className="text-xs text-muted max-w-sm mb-6">
            You do not currently have any properties listed under your account. Register your first
            farmhouse to unlock live business analytics.
          </p>
          <button
            onClick={() => (window.location.href = "/farmhouses/new")}
            className="px-5 py-2.5 bg-accent-primary text-white font-[Inter_600SemiBold] text-xs rounded-xl shadow-sm hover:opacity-90"
          >
            Add Your Farmhouse
          </button>
        </div>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              SECTION 1: BUSINESS HEALTH (HERO FEATURE)
          ───────────────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-surface to-accent-primary/5 border border-border rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-[Inter_700Bold] bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    <Sparkles className="w-3 h-3" />
                    Business Health Summary
                  </span>
                  <span className="text-xs text-muted">
                    {period === "7d"
                      ? "Last 7 Days"
                      : period === "30d"
                      ? "Last 30 Days"
                      : period === "this_month"
                      ? "This Month"
                      : period === "3m"
                      ? "Last 3 Months"
                      : "Selected Period"}
                  </span>
                </div>

                <h2 className="text-base md:text-lg font-[Inter_700Bold] text-primary leading-relaxed">
                  {health?.narrative}
                </h2>

                {health?.alert && (
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl text-xs font-[Inter_600SemiBold] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{health.alert}</span>
                  </div>
                )}
              </div>

              {/* Quick Health Status Indicator Badge */}
              <div className="flex items-center md:flex-col justify-between md:justify-center p-3 md:px-5 md:py-3 bg-surface border border-border/80 rounded-xl shadow-sm shrink-0">
                <span className="text-[11px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted">
                  Occupancy
                </span>
                <span className="text-2xl font-[Inter_800ExtraBold] text-accent-primary">
                  {overview?.occupancyRate}%
                </span>
                <span className="text-[10px] text-muted">
                  {overview?.occupancyRate >= 65 ? "🟢 Performing High" : "🟡 Opportunity to Grow"}
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 2: DASHBOARD OVERVIEW (KEY METRICS 2x3 GRID)
          ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Total Revenue */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm hover:border-accent-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted">
                  Total Revenue
                </span>
                <span className="text-base">💰</span>
              </div>
              <div className="mt-3">
                <p className="text-lg md:text-xl font-[Inter_800ExtraBold] text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(overview?.totalRevenue)}
                </p>
                <p className="text-[10px] text-muted mt-0.5">Retained after refunds</p>
              </div>
            </div>

            {/* Card 2: Total Bookings */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm hover:border-accent-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted">
                  Total Bookings
                </span>
                <span className="text-base">📅</span>
              </div>
              <div className="mt-3">
                <p className="text-lg md:text-xl font-[Inter_800ExtraBold] text-primary">
                  {overview?.totalBookings}
                </p>
                <p className="text-[10px] text-muted mt-0.5">In selected period</p>
              </div>
            </div>

            {/* Card 3: Completed Bookings */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm hover:border-accent-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted">
                  Completed
                </span>
                <span className="text-base">✅</span>
              </div>
              <div className="mt-3">
                <p className="text-lg md:text-xl font-[Inter_800ExtraBold] text-emerald-600 dark:text-emerald-400">
                  {overview?.completedBookings}
                </p>
                <p className="text-[10px] text-muted mt-0.5">Finished stays</p>
              </div>
            </div>

            {/* Card 4: Cancelled Bookings */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted">
                  Cancelled
                </span>
                <span className="text-base">❌</span>
              </div>
              <div className="mt-3">
                <p className="text-lg md:text-xl font-[Inter_800ExtraBold] text-rose-600 dark:text-rose-400">
                  {overview?.cancelledBookings}
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  Rate: {cancellation?.cancellationRate}%
                </p>
              </div>
            </div>

            {/* Card 5: Upcoming Bookings */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm hover:border-accent-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted">
                  Upcoming
                </span>
                <span className="text-base">⏳</span>
              </div>
              <div className="mt-3">
                <p className="text-lg md:text-xl font-[Inter_800ExtraBold] text-accent-primary">
                  {overview?.upcomingBookings}
                </p>
                <p className="text-[10px] text-muted mt-0.5">Arriving in future</p>
              </div>
            </div>

            {/* Card 6: Occupancy Rate */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm hover:border-accent-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted">
                  Occupancy
                </span>
                <span className="text-base">📊</span>
              </div>
              <div className="mt-3">
                <p className="text-lg md:text-xl font-[Inter_800ExtraBold] text-primary">
                  {overview?.occupancyRate}%
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  {occupancy?.bookedNights}/{occupancy?.totalNights} nights
                </p>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 3: REVENUE ANALYTICS (TRANSPARENT BREAKDOWN)
          ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Financial Waterfall Breakdown */}
            <div className="lg:col-span-6 bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-[Inter_700Bold] text-primary">
                      Revenue & Cash Breakdown
                    </h3>
                    <p className="text-xs text-muted">
                      Clear accounting between bookings, advance collected, and net retained money.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-[Inter_700Bold] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Transparent
                  </span>
                </div>

                <div className="space-y-3.5 my-4">
                  {/* Total Booking Value */}
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <span className="text-xs font-[Inter_600SemiBold] text-primary">
                        Total Booking Value
                      </span>
                      <p className="text-[10px] text-muted">Gross value of confirmed stays</p>
                    </div>
                    <span className="text-sm font-[Inter_700Bold] text-primary">
                      {formatCurrency(revenue?.totalBookingValue)}
                    </span>
                  </div>

                  {/* Cash & Token Collected */}
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <span className="text-xs font-[Inter_600SemiBold] text-emerald-700 dark:text-emerald-400">
                        Amount Collected
                      </span>
                      <p className="text-[10px] text-muted">Advance tokens & confirmed cash</p>
                    </div>
                    <span className="text-sm font-[Inter_700Bold] text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(revenue?.amountCollected)}
                    </span>
                  </div>

                  {/* Pending Payments Due at Check-In */}
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <span className="text-xs font-[Inter_600SemiBold] text-amber-700 dark:text-amber-400">
                        Pending Payments
                      </span>
                      <p className="text-[10px] text-muted">Balance to be collected at check-in</p>
                    </div>
                    <span className="text-sm font-[Inter_700Bold] text-amber-700 dark:text-amber-400">
                      {formatCurrency(revenue?.pendingPayments)}
                    </span>
                  </div>

                  {/* Refunds Issued */}
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <span className="text-xs font-[Inter_600SemiBold] text-rose-700 dark:text-rose-400">
                        Refunds Issued
                      </span>
                      <p className="text-[10px] text-muted">Paid back for cancelled stays</p>
                    </div>
                    <span className="text-sm font-[Inter_700Bold] text-rose-700 dark:text-rose-400">
                      -{formatCurrency(revenue?.refundsIssued)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Retained Money Box */}
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-[Inter_700Bold] text-emerald-900 dark:text-emerald-200">
                    Net Revenue Retained
                  </span>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    Your actual earnings after all refunds
                  </p>
                </div>
                <span className="text-xl font-[Inter_800ExtraBold] text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(revenue?.netRevenue)}
                </span>
              </div>
            </div>

            {/* Right: Monthly Performance Comparison */}
            <div className="lg:col-span-6 bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-base font-[Inter_700Bold] text-primary">
                      Monthly Revenue Comparison
                    </h3>
                    <p className="text-xs text-muted">
                      Month-on-Month earnings trend across the last 6 months.
                    </p>
                  </div>
                  <span className="text-xs font-[Inter_600SemiBold] text-muted">Last 6 Months</span>
                </div>

                {/* Monthly Bar Visualizer */}
                <div className="pt-6 pb-2">
                  {revenue?.monthlyTrends && revenue.monthlyTrends.length > 0 ? (
                    (() => {
                      const maxRev = Math.max(
                        ...revenue.monthlyTrends.map((t: any) => t.revenue || 0),
                        1000
                      );

                      return (
                        <div className="grid grid-cols-6 gap-2 items-end h-44 border-b border-border/60 pb-2">
                          {revenue.monthlyTrends.map((t: any) => {
                            const barHeightPercent = Math.max(
                              8,
                              Math.round((t.revenue / maxRev) * 100)
                            );
                            const isCurrent =
                              t.month ===
                              new Date().toLocaleString("en-IN", { month: "short" });

                            return (
                              <div
                                key={t.month}
                                className="flex flex-col items-center justify-end h-full group"
                              >
                                <span className="text-[10px] font-[Inter_700Bold] text-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                  ₹{Math.round(t.revenue / 1000)}k
                                </span>
                                <div
                                  style={{ height: `${barHeightPercent}%` }}
                                  className={`w-full max-w-[38px] rounded-t-lg transition-all duration-500 ${
                                    isCurrent
                                      ? "bg-accent-primary"
                                      : "bg-border/80 group-hover:bg-accent-primary/60"
                                  }`}
                                />
                                <span className="text-[11px] font-[Inter_600SemiBold] text-muted mt-2">
                                  {t.month}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="h-40 flex items-center justify-center text-xs text-muted">
                      No monthly revenue history available.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 text-[11px] text-muted border-t border-border/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-accent-primary inline-block" /> Current
                  Month
                </span>
                <span>Hover over bars to inspect values</span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 4: BOOKING CANCELLATION ANALYTICS
          ───────────────────────────────────────────────────────────── */}
          <div className="bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-[Inter_700Bold] text-primary flex items-center gap-2">
                  <span>Booking Cancellation Analytics</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-[Inter_700Bold] ${
                      cancellation?.cancellationRate > 20
                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    }`}
                  >
                    {cancellation?.cancellationRate}% Rate
                  </span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Understand lost bookings, cancellation fees retained, and smart rebooked dates.
                </p>
              </div>

              {cancellation?.smartRebookedCount > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-[Inter_700Bold]">
                  <span>🎯 {cancellation.smartRebookedCount} Cancelled Dates Were Rebooked!</span>
                </div>
              )}
            </div>

            {/* Metric Cards in 4 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-surface border border-border/80">
                <span className="text-[11px] font-[Inter_600SemiBold] text-muted uppercase tracking-wider">
                  Cancelled Stays
                </span>
                <p className="text-xl font-[Inter_800ExtraBold] text-rose-600 mt-1">
                  {cancellation?.cancelledBookings}{" "}
                  <span className="text-xs font-normal text-muted">
                    of {cancellation?.totalBookings}
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border/80">
                <span className="text-[11px] font-[Inter_600SemiBold] text-muted uppercase tracking-wider">
                  Total Cancelled Value
                </span>
                <p className="text-xl font-[Inter_800ExtraBold] text-primary mt-1">
                  {formatCurrency(cancellation?.cancelledValue)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border/80">
                <span className="text-[11px] font-[Inter_600SemiBold] text-muted uppercase tracking-wider">
                  Fees You Retained
                </span>
                <p className="text-xl font-[Inter_800ExtraBold] text-emerald-600 mt-1">
                  {formatCurrency(cancellation?.cancellationFeesRetained)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border/80">
                <span className="text-[11px] font-[Inter_600SemiBold] text-muted uppercase tracking-wider">
                  True Lost Revenue
                </span>
                <p className="text-xl font-[Inter_800ExtraBold] text-rose-600 mt-1">
                  {formatCurrency(cancellation?.potentialLostRevenue)}
                </p>
              </div>
            </div>

            {/* Reasons Breakdown Bars */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-[Inter_700Bold] text-primary uppercase tracking-wider">
                Cancellation Reasons Breakdown
              </h4>

              {cancellation?.reasonsBreakdown && cancellation.reasonsBreakdown.length > 0 ? (
                <div className="space-y-2.5">
                  {cancellation.reasonsBreakdown.map((r: any) => (
                    <div key={r.reason} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-[Inter_600SemiBold] text-primary">{r.reason}</span>
                        <span className="text-muted font-[Inter_600SemiBold]">
                          {r.count} {r.count === 1 ? "booking" : "bookings"} ({r.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden">
                        <div
                          style={{ width: `${r.percent}%` }}
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-border/60 border-dashed rounded-xl text-center text-xs text-muted">
                  🎉 Zero cancellations recorded in this period!
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 5: BOOKING PERFORMANCE & DEMAND
          ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Efficiency Metrics */}
            <div className="lg:col-span-6 bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-[Inter_700Bold] text-primary">
                  Property Efficiency
                </h3>
                <p className="text-xs text-muted">Key operational averages per guest booking.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-surface border border-border text-center">
                  <span className="text-[10px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted block">
                    Avg Booking Value
                  </span>
                  <span className="text-base font-[Inter_800ExtraBold] text-primary mt-1 block">
                    {formatCurrency(performance?.avgBookingValue)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border text-center">
                  <span className="text-[10px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted block">
                    Avg Token Advance
                  </span>
                  <span className="text-base font-[Inter_800ExtraBold] text-emerald-600 block mt-1">
                    {formatCurrency(performance?.avgAdvancePayment)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border text-center">
                  <span className="text-[10px] font-[Inter_600SemiBold] uppercase tracking-wider text-muted block">
                    Avg Duration
                  </span>
                  <span className="text-base font-[Inter_800ExtraBold] text-primary block mt-1">
                    {performance?.avgStayDuration} {performance?.avgStayDuration === 1 ? "Night" : "Nights"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-accent-primary/5 border border-accent-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-xs font-[Inter_600SemiBold] text-primary">
                    Most Popular Check-in Day
                  </span>
                </div>
                <span className="text-xs font-[Inter_800ExtraBold] text-accent-primary bg-surface px-2.5 py-1 rounded-lg border border-accent-primary/20">
                  {performance?.mostPopularDay}
                </span>
              </div>
            </div>

            {/* Weekday vs Weekend Split */}
            <div className="lg:col-span-6 bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-base font-[Inter_700Bold] text-primary">
                      Weekday vs Weekend Demand
                    </h3>
                    <p className="text-xs text-muted">
                      Weekend (Fri/Sat/Sun) vs Weekday check-in distribution.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Split Visual Progress */}
                  <div className="h-6 w-full rounded-xl overflow-hidden flex bg-border/40 shadow-inner">
                    <div
                      style={{
                        width: `${performance?.weekdayVsWeekend?.weekendPercent || 50}%`,
                      }}
                      className="bg-accent-primary flex items-center justify-center text-[11px] font-[Inter_800ExtraBold] text-white transition-all duration-500"
                    >
                      {performance?.weekdayVsWeekend?.weekendPercent > 15
                        ? `${performance?.weekdayVsWeekend?.weekendPercent}% Weekend`
                        : ""}
                    </div>
                    <div
                      style={{
                        width: `${performance?.weekdayVsWeekend?.weekdayPercent || 50}%`,
                      }}
                      className="bg-amber-500 flex items-center justify-center text-[11px] font-[Inter_800ExtraBold] text-white transition-all duration-500"
                    >
                      {performance?.weekdayVsWeekend?.weekdayPercent > 15
                        ? `${performance?.weekdayVsWeekend?.weekdayPercent}% Weekday`
                        : ""}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-accent-primary" />
                      <span className="font-[Inter_600SemiBold] text-primary">
                        Weekend Stays: {performance?.weekdayVsWeekend?.weekendCount} (
                        {performance?.weekdayVsWeekend?.weekendPercent}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-amber-500" />
                      <span className="font-[Inter_600SemiBold] text-primary">
                        Weekday Stays: {performance?.weekdayVsWeekend?.weekdayCount} (
                        {performance?.weekdayVsWeekend?.weekdayPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Tip */}
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>Actionable Tip:</strong> If your weekday bookings are low, introduce a
                  workation or corporate package to capture Monday–Thursday demand.
                </p>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 6: OCCUPANCY ANALYTICS & INTERACTIVE CALENDAR MATRIX
          ───────────────────────────────────────────────────────────── */}
          <div className="bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-[Inter_700Bold] text-primary flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-accent-primary" />
                  <span>Occupancy & Date Gap Analysis</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Spot unbooked dates and availability gaps to maximize rental nights.
                </p>
              </div>

              {/* Quick stats pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-[Inter_700Bold]">
                  🟢 {occupancy?.bookedNights} Nights Booked
                </span>
                <span className="px-3 py-1 rounded-xl bg-surface border border-border text-muted font-[Inter_600SemiBold]">
                  ⬜ {occupancy?.unbookedNights} Nights Available
                </span>
                {occupancy?.blockedNights > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-[Inter_700Bold]">
                    🟡 {occupancy?.blockedNights} Blocked
                  </span>
                )}
              </div>
            </div>

            {/* Calendar Day Matrix Grid */}
            <div className="pt-2">
              {occupancy?.calendarDays && occupancy.calendarDays.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-14 gap-2">
                  {occupancy.calendarDays.map((d: any) => {
                    const isBooked = d.status === "BOOKED";
                    const isBlocked = d.status === "BLOCKED";
                    const isCancelled = d.status === "CANCELLED";

                    const dayNum = d.date.split("-")[2];

                    let bgClass = "bg-surface border-border/70 hover:border-accent-primary/60";
                    let badgeClass = "text-muted";
                    let statusLabel = "Available";

                    if (isBooked) {
                      bgClass = "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-200";
                      badgeClass = "text-emerald-700 dark:text-emerald-300";
                      statusLabel = "Booked";
                    } else if (isBlocked) {
                      bgClass = "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-200";
                      badgeClass = "text-amber-700 dark:text-amber-300";
                      statusLabel = "Blocked";
                    } else if (isCancelled) {
                      bgClass = "bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-200";
                      badgeClass = "text-rose-700 dark:text-rose-300";
                      statusLabel = "Cancelled";
                    }

                    return (
                      <div
                        key={d.date}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all shadow-sm ${bgClass}`}
                        title={`${d.date} (${d.dayOfWeek}): ${statusLabel}`}
                      >
                        <span className="text-[10px] font-[Inter_600SemiBold] uppercase opacity-70">
                          {d.dayOfWeek}
                        </span>
                        <span className="text-sm font-[Inter_800ExtraBold] my-0.5">{dayNum}</span>
                        <span className={`text-[9px] font-[Inter_700Bold] ${badgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted border border-border/60 border-dashed rounded-xl">
                  No date records found for the selected period.
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-[11px] text-muted border-t border-border/50">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Booked Stay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-border" /> Available Gap
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Blocked by Owner
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cancelled Date
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 7: PHASE 3 GROWTH & OPTIMIZATION TOOLS
          ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Underperforming Date Alerts & Promotional Suggestions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Gap Watcher Alerts */}
              <div className="bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <BellRing className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-[Inter_700Bold] text-primary">
                        Underperforming Date Alerts
                      </h3>
                      <p className="text-xs text-muted">Upcoming unbooked gaps within the next 14 days.</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-[Inter_700Bold] bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    Proactive Watcher
                  </span>
                </div>

                {growth?.underperformingAlerts && growth.underperformingAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {growth.underperformingAlerts.map((alert: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-[Inter_700Bold] text-rose-700 dark:text-rose-400">
                              {alert.title}
                            </span>
                            <span className="text-[10px] font-[Inter_800ExtraBold] px-2 py-0.5 rounded-full bg-rose-600 text-white">
                              {alert.priority} PRIORITY
                            </span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            {alert.message}
                          </p>
                        </div>
                        <button
                          onClick={() => (window.location.href = "/pricing")}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-[Inter_700Bold] shadow-sm shrink-0"
                        >
                          {alert.suggestedDiscount}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border border-border/60 border-dashed rounded-xl text-center text-xs text-muted">
                    🎉 Excellent! All upcoming weekends in the next 14 days have bookings or no urgent gaps.
                  </div>
                )}
              </div>

              {/* Promotional Suggestions */}
              <div className="bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-accent-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-[Inter_700Bold] text-primary">
                        Recommended Promotional Deals
                      </h3>
                      <p className="text-xs text-muted">Actionable suggestions to capture extra bookings.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {growth?.promotionalSuggestions?.map((deal: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between hover:border-accent-primary/50 transition-all shadow-sm"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-[Inter_800ExtraBold] px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary inline-block">
                          {deal.discountBadge}
                        </span>
                        <h4 className="text-xs font-[Inter_700Bold] text-primary pt-1">
                          {deal.title}
                        </h4>
                        <p className="text-[10px] text-muted leading-relaxed">{deal.reason}</p>
                      </div>
                      <button
                        onClick={() => (window.location.href = "/pricing")}
                        className="mt-3 w-full py-1.5 text-center text-[11px] font-[Inter_600SemiBold] text-accent-primary hover:underline border-t border-border/60 pt-2"
                      >
                        Apply Deal →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Repeat Customer Analytics & Guest Loyalty */}
            <div className="lg:col-span-5 bg-surface p-5 md:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Award className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-[Inter_700Bold] text-primary">
                        Guest Loyalty & Retention
                      </h3>
                      <p className="text-xs text-muted">First-time vs. repeat guest conversion.</p>
                    </div>
                  </div>
                  <span className="text-xs font-[Inter_800ExtraBold] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {growth?.repeatCustomers?.repeatGuestRate}% Repeat Rate
                  </span>
                </div>

                {/* Ratio bar */}
                <div className="space-y-2 pt-4">
                  <div className="h-4 w-full rounded-lg overflow-hidden flex bg-border/40 shadow-inner">
                    <div
                      style={{
                        width: `${Math.max(
                          10,
                          100 - (growth?.repeatCustomers?.repeatGuestRate || 0)
                        )}%`,
                      }}
                      className="bg-accent-primary flex items-center justify-center text-[10px] font-[Inter_700Bold] text-white"
                    >
                      {100 - (growth?.repeatCustomers?.repeatGuestRate || 0)}% New
                    </div>
                    <div
                      style={{
                        width: `${Math.max(10, growth?.repeatCustomers?.repeatGuestRate || 0)}%`,
                      }}
                      className="bg-emerald-500 flex items-center justify-center text-[10px] font-[Inter_700Bold] text-white"
                    >
                      {growth?.repeatCustomers?.repeatGuestRate || 0}% Repeat
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span>
                      New Guests: <strong>{growth?.repeatCustomers?.newGuestsCount || 0}</strong>
                    </span>
                    <span>
                      Repeat Guests:{" "}
                      <strong className="text-emerald-600">
                        {growth?.repeatCustomers?.repeatGuestsCount || 0}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Top Loyal Returning Guests Table */}
                <div className="pt-5 space-y-2.5">
                  <span className="text-[11px] font-[Inter_700Bold] uppercase tracking-wider text-muted">
                    Top Returning Guests
                  </span>

                  {growth?.repeatCustomers?.topLoyalGuests &&
                  growth.repeatCustomers.topLoyalGuests.length > 0 ? (
                    <div className="space-y-2">
                      {growth.repeatCustomers.topLoyalGuests.map((g: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl border border-border/80 bg-surface flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-700 font-[Inter_700Bold] flex items-center justify-center text-xs">
                              {g.visits}x
                            </div>
                            <div>
                              <p className="font-[Inter_700Bold] text-primary">{g.name}</p>
                              <p className="text-[10px] text-muted">{g.phone || "Verified Guest"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-[Inter_800ExtraBold] text-emerald-600">
                              {formatCurrency(g.totalSpent)}
                            </span>
                            <p className="text-[9px] text-muted">Total Spent</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted border border-border/60 border-dashed rounded-xl">
                      No repeat booking records yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 text-[11px] text-muted border-t border-border/50">
                💡 Retaining existing guests costs 5x less than acquiring new customers. Send greeting messages to top guests before peak seasons.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
