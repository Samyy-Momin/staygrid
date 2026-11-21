"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Home, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert,
  Percent,
  X,
  History as HistoryIcon,
  ChevronRight,
  Clock,
  HelpCircle,
  Calendar
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function MoneyManagementPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const isOwner = String((session?.user as any)?.role).toUpperCase() === "OWNER";

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("overview"); // "overview" | "bookings" | "payouts" | "refunds" | "history"
  const [searchQuery, setSearchQuery] = useState("");

  // Slide-over drawer state
  const [drawerBookingId, setDrawerBookingId] = useState<string | null>(null);

  // Guided Action Modals state
  const [confirmCashModalBooking, setConfirmCashModalBooking] = useState<any>(null);
  
  const [payoutModalBooking, setPayoutModalBooking] = useState<any>(null);
  const [payoutTxnId, setPayoutTxnId] = useState("");

  const [recordPaymentModalBooking, setRecordPaymentModalBooking] = useState<any>(null);
  const [recordPaymentTxnId, setRecordPaymentTxnId] = useState("");

  const [refundModalBooking, setRefundModalBooking] = useState<any>(null);
  const [isOverrideRefund, setIsOverrideRefund] = useState(false);
  const [customRefundAmount, setCustomRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("Customer phone request exception approved");
  const [refundTxnId, setRefundTxnId] = useState("");

  const [shareModalBooking, setShareModalBooking] = useState<any>(null);
  const [newSharePercentage, setNewSharePercentage] = useState<number>(20);
  const [shareReason, setShareReason] = useState("Video/Reel Production");
  const [shareNotes, setShareNotes] = useState("");

  // 1. Fetch Money Overview (Live Data)
  const { data: overview, isLoading: isOverviewLoading, isError: isOverviewError, refetch: refetchOverview } = useQuery({
    queryKey: ["money-overview"],
    queryFn: async () => {
      const res = await api.get("/admin/finance/overview");
      return res.data;
    },
    enabled: !isOwner && !isSessionPending,
  });

  // 2. Fetch Bookings Financial List (Live Data)
  const { data: bookings = [], isLoading: isBookingsLoading, isError: isBookingsError, refetch: refetchBookings } = useQuery({
    queryKey: ["money-bookings", activeTab, searchQuery],
    queryFn: async () => {
      const res = await api.get(`/admin/finance/bookings?tab=${activeTab}&search=${encodeURIComponent(searchQuery)}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !isOwner && !isSessionPending,
  });

  // 3. Fetch Booking Financial Detail for Slide-Over Drawer (Live Data)
  const { data: drawerData, isLoading: isDrawerLoading } = useQuery({
    queryKey: ["money-booking-detail", drawerBookingId],
    queryFn: async () => {
      if (!drawerBookingId) return null;
      const res = await api.get(`/admin/finance/bookings/${drawerBookingId}`);
      return res.data;
    },
    enabled: !!drawerBookingId,
  });

  // 4. Fetch History Logs (Live Data)
  const { data: historyLogs = [], isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["money-history"],
    queryFn: async () => {
      const res = await api.get("/admin/finance/history");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: activeTab === "history",
  });

  // Mutations
  const confirmCashMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/admin/finance/confirm-cash/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-overview"] });
      queryClient.invalidateQueries({ queryKey: ["money-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["money-booking-detail"] });
      setConfirmCashModalBooking(null);
    },
  });

  const settlePayoutMutation = useMutation({
    mutationFn: async ({ bookingId, txnId }: { bookingId: string; txnId: string }) => {
      await api.patch(`/admin/finance/payout/${bookingId}`, { txnId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-overview"] });
      queryClient.invalidateQueries({ queryKey: ["money-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["money-booking-detail"] });
      setPayoutModalBooking(null);
      setPayoutTxnId("");
    },
  });

  const recordOwnerPaymentMutation = useMutation({
    mutationFn: async ({ bookingId, txnId }: { bookingId: string; txnId: string }) => {
      await api.patch(`/admin/finance/record-owner-payment/${bookingId}`, { txnId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-overview"] });
      queryClient.invalidateQueries({ queryKey: ["money-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["money-booking-detail"] });
      setRecordPaymentModalBooking(null);
      setRecordPaymentTxnId("");
    },
  });

  const settleRefundMutation = useMutation({
    mutationFn: async ({ bookingId, refundAmount, isOverride, reason, txnId }: any) => {
      await api.patch(`/admin/finance/refund/${bookingId}`, {
        refundAmount,
        isOverride,
        reason,
        txnId: txnId || `rfnd_${Date.now()}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-overview"] });
      queryClient.invalidateQueries({ queryKey: ["money-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["money-booking-detail"] });
      setRefundModalBooking(null);
    },
  });

  const updateShareMutation = useMutation({
    mutationFn: async ({ bookingId, commissionPercentage, reason, notes }: any) => {
      await api.patch(`/admin/finance/commission/${bookingId}`, {
        commissionPercentage,
        reason,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-overview"] });
      queryClient.invalidateQueries({ queryKey: ["money-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["money-booking-detail"] });
      setShareModalBooking(null);
    },
  });

  // Human Status Badge Renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "CLOSED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">🟢 Closed</span>;
      case "WAITING_FOR_CASH":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">🟠 Waiting for Cash</span>;
      case "READY_TO_PAY_OWNER":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">🔵 Ready to Pay Owner</span>;
      case "REFUND_NEEDED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">🔴 Refund Needed</span>;
      case "OWNER_OWES_STAYGRID":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">🔴 Owner Owes StayGrid</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface border border-border text-muted">⚠️ Needs Checking</span>;
    }
  };

  if (isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">Access Restricted</h2>
        <p className="text-sm text-muted max-w-md mb-6">
          The Money & Platform Finance portal is restricted to System Administrators. Owner financial statements and analytics will be available on your dedicated Owner Analytics dashboard.
        </p>
        <button
          onClick={() => router.push("/analytics")}
          className="px-5 py-2.5 bg-accent-primary text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity"
        >
          Go to Owner Analytics
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4 font-sans">
      {/* 🔔 1. Needs Your Attention Banner at the VERY TOP */}
      {overview?.attentionItems?.totalAttentionCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <h3 className="text-xs font-[Inter_800ExtraBold] text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            🔔 {overview.attentionItems.totalAttentionCount} things need your attention:
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {overview.attentionItems.ownersToPayCount > 0 && (
              <button
                onClick={() => setActiveTab("payouts")}
                className="px-3 py-1 bg-surface border border-amber-500/40 rounded-lg text-xs font-bold text-primary hover:bg-amber-500/20 transition flex items-center gap-1"
              >
                🏠 {overview.attentionItems.ownersToPayCount} owners to pay
                <ChevronRight className="w-3 h-3 text-amber-600" />
              </button>
            )}

            {overview.attentionItems.cashUnconfirmedCount > 0 && (
              <button
                onClick={() => setActiveTab("bookings")}
                className="px-3 py-1 bg-surface border border-amber-500/40 rounded-lg text-xs font-bold text-primary hover:bg-amber-500/20 transition flex items-center gap-1"
              >
                💵 {overview.attentionItems.cashUnconfirmedCount} cash unconfirmed
                <ChevronRight className="w-3 h-3 text-amber-600" />
              </button>
            )}

            {overview.attentionItems.refundsPendingCount > 0 && (
              <button
                onClick={() => setActiveTab("refunds")}
                className="px-3 py-1 bg-surface border border-amber-500/40 rounded-lg text-xs font-bold text-primary hover:bg-amber-500/20 transition flex items-center gap-1"
              >
                🔄 {overview.attentionItems.refundsPendingCount} refunds pending
                <ChevronRight className="w-3 h-3 text-amber-600" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Action Row: Refresh + History Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === "history" ? "all" : "history")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeTab === "history" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-surface text-primary border-border hover:bg-border/40"
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            📜 History Log
          </button>
        </div>

        <button
          onClick={() => {
            refetchOverview();
            refetchBookings();
            if (activeTab === "history") refetchHistory();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-xl font-semibold text-xs text-primary hover:bg-border/40 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          Refresh
        </button>
      </div>

      {/* Error Retry Banner */}
      {isOverviewError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-rose-700 dark:text-rose-400">⚠️ Couldn't load money data from StayGrid.</span>
          </div>
          <button onClick={() => refetchOverview()} className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg">
            Try Again
          </button>
        </div>
      )}

      {/* 2. Interactive KPI Cards (Merged with Tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Booking Value */}
        <button
          onClick={() => setActiveTab("all")}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === "all" || activeTab === "overview"
              ? "bg-blue-500/10 border-blue-600 ring-2 ring-blue-600/30 shadow-sm"
              : "bg-surface border-border hover:bg-border/40"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-muted block mb-0.5">💰 Booking Value</span>
          <div className="text-xl font-[Inter_800ExtraBold] text-primary">
            ₹{isOverviewLoading ? "..." : (overview?.totalBookingValue || 0).toLocaleString("en-IN")}
          </div>
        </button>

        {/* Card 2: Received by Us */}
        <button
          onClick={() => setActiveTab("received")}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === "received"
              ? "bg-emerald-500/15 border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm"
              : "bg-surface border-border hover:bg-border/40"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block mb-0.5">🟢 Received by Us</span>
          <div className="text-xl font-[Inter_800ExtraBold] text-emerald-600">
            ₹{isOverviewLoading ? "..." : (overview?.staygridReceivedTotal || 0).toLocaleString("en-IN")}
          </div>
        </button>

        {/* Card 3: StayGrid Earns */}
        <button
          onClick={() => setActiveTab("earns")}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === "earns"
              ? "bg-emerald-500/20 border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm"
              : "bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block mb-0.5">📈 StayGrid Earns</span>
          <div className="text-xl font-[Inter_800ExtraBold] text-emerald-700 dark:text-emerald-400">
            ₹{isOverviewLoading ? "..." : (overview?.staygridEarnsTotal || 0).toLocaleString("en-IN")}
          </div>
        </button>

        {/* Card 4: Owner Payments */}
        <button
          onClick={() => setActiveTab("payouts")}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === "payouts"
              ? "bg-blue-500/15 border-blue-600 ring-2 ring-blue-600/30 shadow-sm"
              : "bg-surface border-border hover:bg-border/40"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400 block mb-0.5">🏠 Owner Payments</span>
          <div className="text-xl font-[Inter_800ExtraBold] text-blue-600">
            ₹{isOverviewLoading ? "..." : (overview?.ownerPaymentsTotal || 0).toLocaleString("en-IN")}
          </div>
        </button>

        {/* Card 5: Refunds */}
        <button
          onClick={() => setActiveTab("refunds")}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === "refunds"
              ? "bg-rose-500/15 border-rose-600 ring-2 ring-rose-600/30 shadow-sm"
              : "bg-surface border-border hover:bg-border/40"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400 block mb-0.5">🔴 Refunds</span>
          <div className="text-xl font-[Inter_800ExtraBold] text-rose-600">
            ₹{isOverviewLoading ? "..." : (overview?.refundsTotal || 0).toLocaleString("en-IN")}
          </div>
        </button>
      </div>

      {/* MAIN BOOKINGS / PAYOUTS / REFUNDS TABLE */}
      {activeTab !== "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-[Inter_800ExtraBold] text-primary">
              {activeTab === "overview" && "All Bookings Financial Activity"}
              {activeTab === "bookings" && "Bookings Money Ledger"}
              {activeTab === "payouts" && "🏠 Owner Payouts & Balance Due"}
              {activeTab === "refunds" && "🔄 Customer Refund Management"}
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
              <input
                type="text"
                placeholder="Search ref, farmhouse, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
            {isBookingsLoading ? (
              <div className="p-16 text-center text-muted font-medium">Loading money data...</div>
            ) : bookings.length === 0 ? (
              <div className="p-16 text-center">
                <ShieldAlert className="w-12 h-12 text-muted mx-auto mb-3" />
                <h3 className="text-base font-bold text-primary mb-1">No Financial Activity Found</h3>
                <p className="text-xs text-muted max-w-sm mx-auto font-medium">
                  {searchQuery ? "No bookings matched your search terms." : "Your financial activity will appear here once the first booking is created."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface border-b border-border/80 text-muted uppercase tracking-wider text-[10px] font-extrabold">
                      <th className="py-3.5 px-4">Booking</th>
                      <th className="py-3.5 px-4">Property</th>
                      <th className="py-3.5 px-4 text-right">Booking Total</th>
                      <th className="py-3.5 px-4 text-right">StayGrid Received</th>
                      <th className="py-3.5 px-4 text-center">Owner Cash</th>
                      <th className="py-3.5 px-4 text-right bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">StayGrid Earns</th>
                      <th className="py-3.5 px-4 text-right">Owner Remaining</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Guided Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {bookings.map((item: any) => (
                      <tr key={item.id} className="hover:bg-border/30 transition cursor-pointer" onClick={() => setDrawerBookingId(item.id)}>
                        <td className="py-4 px-4 font-mono font-bold text-blue-600">
                          {item.bookingRef}
                        </td>

                        <td className="py-4 px-4 max-w-[180px]">
                          <div className="font-bold text-primary truncate">{item.farmhouse?.title}</div>
                          <div className="text-[11px] text-muted truncate">{item.farmhouse?.owner?.name}</div>
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-primary">
                          ₹{item.totalAmount?.toLocaleString("en-IN")}
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-emerald-600">
                          ₹{item.staygridReceived?.toLocaleString("en-IN")}
                        </td>

                        <td className="py-4 px-4 text-center">
                          {item.isCashConfirmed ? (
                            <span className="text-emerald-600 font-bold">₹{item.ownerGot?.toLocaleString("en-IN")} ✅</span>
                          ) : (
                            <span className="text-amber-600 font-bold">⚠️ Unconfirmed</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right font-extrabold text-emerald-600 bg-emerald-500/5 border-x border-emerald-500/20">
                          ₹{item.staygridEarns?.toLocaleString("en-IN")}
                          <div className="text-[9px] text-emerald-700/80 font-bold">({item.commissionPercentage}%)</div>
                        </td>

                        <td className="py-4 px-4 text-right font-bold">
                          {item.ownerRemaining < 0 ? (
                            <span className="text-purple-600 font-extrabold">-₹{Math.abs(item.ownerRemaining).toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-primary font-bold">₹{item.ownerRemaining?.toLocaleString("en-IN")}{!item.isCashConfirmed && "*"}</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          {renderStatusBadge(item.humanStatus)}
                        </td>

                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {item.guidedAction === "CONFIRM_CASH" && (
                            <button
                              onClick={() => setConfirmCashModalBooking(item)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[11px] shadow-sm"
                            >
                              💵 Confirm Cash
                            </button>
                          )}

                          {item.guidedAction === "PAY_OWNER" && (
                            <button
                              onClick={() => {
                                setPayoutModalBooking(item);
                                setPayoutTxnId("");
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] shadow-sm"
                            >
                              🏠 Pay Owner
                            </button>
                          )}

                          {item.guidedAction === "RECORD_OWNER_PAYMENT" && (
                            <button
                              onClick={() => {
                                setRecordPaymentModalBooking(item);
                                setRecordPaymentTxnId("");
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[11px] shadow-sm"
                            >
                              🔴 Record Payment
                            </button>
                          )}

                          {item.guidedAction === "REFUND_CUSTOMER" && (
                            <button
                              onClick={() => {
                                setRefundModalBooking(item);
                                setCustomRefundAmount(item.refundAmount || 0);
                                setIsOverrideRefund(item.isCustomRefundOverride || false);
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[11px] shadow-sm"
                            >
                              🔄 Refund Guest
                            </button>
                          )}

                          {item.guidedAction === "VIEW_DETAILS" && (
                            <button
                              onClick={() => setDrawerBookingId(item.id)}
                              className="px-3 py-1 bg-surface border border-border hover:bg-border/40 text-primary rounded-lg font-semibold text-[10px]"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📜 HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <h2 className="text-lg font-[Inter_800ExtraBold] text-primary">📜 Money Event History Log</h2>
          <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
            {isHistoryLoading ? (
              <div className="p-12 text-center text-muted font-medium">Loading history timeline...</div>
            ) : historyLogs.length === 0 ? (
              <div className="p-12 text-center text-muted font-medium">No money events recorded yet.</div>
            ) : (
              <div className="space-y-4">
                {historyLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-surface border border-border/80 rounded-2xl">
                    <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-blue-600">{log.bookingRef}</span>
                        <span className="text-[11px] text-muted font-medium">
                          {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-primary mt-1">{log.notes}</p>
                      {log.reference && (
                        <p className="text-[11px] font-mono text-muted mt-0.5">Ref/UTR: {log.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RIGHT-SIDE SLIDE-OVER DRAWER (BOOKING FINANCIAL DETAIL) */}
      {drawerBookingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-surface border-l border-border h-full flex flex-col p-6 overflow-y-auto shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-[Inter_800ExtraBold] text-primary">{drawerData?.booking?.bookingRef}</h3>
                <p className="text-xs text-muted font-medium mt-0.5">
                  {drawerData?.booking?.farmhouse?.title} • {drawerData?.booking?.user?.name}
                </p>
              </div>
              <button onClick={() => setDrawerBookingId(null)} className="p-2 rounded-full hover:bg-border/40">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {isDrawerLoading ? (
              <div className="p-12 text-center text-muted font-medium">Loading details...</div>
            ) : (
              <>
                {/* Booking Value */}
                <div className="p-4 bg-surface border border-border rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-muted uppercase">BOOKING VALUE</span>
                  <div className="text-2xl font-[Inter_800ExtraBold] text-primary">
                    ₹{drawerData?.booking?.totalAmount?.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Customer Payment Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Customer Payment Breakdown</h4>
                  <div className="p-4 bg-surface border border-border rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span>• Online Token (StayGrid):</span>
                      <span className="font-bold text-emerald-600">₹{drawerData?.booking?.tokenPaid?.toLocaleString("en-IN")} ✅ RECEIVED</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border/60">
                      <span>• Check-in Cash (Owner):</span>
                      {drawerData?.booking?.isCashConfirmed ? (
                        <span className="font-bold text-emerald-600">₹{drawerData?.booking?.ownerGot?.toLocaleString("en-IN")} ✅ CONFIRMED</span>
                      ) : (
                        <span className="font-bold text-amber-600">⚠️ UNCONFIRMED</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* StayGrid Commission */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">STAYGRID EARNS</span>
                    <button
                      onClick={() => {
                        setShareModalBooking(drawerData.booking);
                        setNewSharePercentage(drawerData.booking.commissionPercentage);
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Percent className="w-3 h-3" />
                      Change StayGrid Share
                    </button>
                  </div>
                  <div className="text-xl font-[Inter_800ExtraBold] text-emerald-600">
                    ₹{drawerData?.booking?.staygridEarns?.toLocaleString("en-IN")} <span className="text-xs font-semibold">({drawerData?.booking?.commissionPercentage}%)</span>
                  </div>
                </div>

                {/* Settlement Calculation */}
                <div className="p-4 bg-surface border border-border rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Owner's Total Share:</span>
                    <span className="font-bold">₹{drawerData?.booking?.ownerShare?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Already Received by Owner:</span>
                    <span>-₹{(drawerData?.booking?.ownerGot || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-center font-bold text-sm">
                    <span>OWNER REMAINING:</span>
                    {drawerData?.booking?.ownerRemaining < 0 ? (
                      <span className="text-purple-600 font-extrabold">-₹{Math.abs(drawerData.booking.ownerRemaining).toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-primary font-extrabold">₹{drawerData?.booking?.ownerRemaining?.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>

                {/* Guided Action Button */}
                {drawerData?.booking?.ownerRemaining > 0 && drawerData?.booking?.isCashConfirmed && drawerData?.booking?.ownerPayoutStatus !== "PAID" && (
                  <button
                    onClick={() => {
                      setPayoutModalBooking(drawerData.booking);
                      setDrawerBookingId(null);
                    }}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md"
                  >
                    🏠 PAY OWNER ₹{drawerData.booking.ownerRemaining.toLocaleString("en-IN")}
                  </button>
                )}

                {/* Money History Log in Drawer */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Money History Timeline</h4>
                  <div className="space-y-2">
                    {drawerData?.transactions?.map((t: any) => (
                      <div key={t.id} className="p-3 bg-surface border border-border rounded-xl text-xs space-y-0.5">
                        <div className="font-bold text-primary">{t.notes}</div>
                        <div className="text-[10px] text-muted">
                          {new Date(t.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* GUIDED TASK MODAL 1: Confirm Cash Collection */}
      {confirmCashModalBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
                💵 Confirm Cash Collection
              </h3>
              <button onClick={() => setConfirmCashModalBooking(null)} className="p-1 rounded-full hover:bg-border/40">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <p className="text-sm font-bold text-primary">
              Was ₹{(confirmCashModalBooking.totalAmount - confirmCashModalBooking.staygridReceived).toLocaleString("en-IN")} collected from {confirmCashModalBooking.user?.name} at check-in for {confirmCashModalBooking.farmhouse?.title}?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setConfirmCashModalBooking(null)} className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold">
                No / Not Yet
              </button>
              <button
                onClick={() => confirmCashMutation.mutate(confirmCashModalBooking.id)}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Yes, Cash Received & Confirmed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDED TASK MODAL 2: Pay Owner */}
      {payoutModalBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
                🏠 Pay Owner
              </h3>
              <button onClick={() => setPayoutModalBooking(null)} className="p-1 rounded-full hover:bg-border/40">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="p-4 bg-surface border border-border rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-primary">
                <span>Property:</span>
                <span>{payoutModalBooking.farmhouse?.title}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Owner Name:</span>
                <span>{payoutModalBooking.farmhouse?.owner?.name} ({payoutModalBooking.farmhouse?.owner?.phone})</span>
              </div>
              <div className="flex justify-between font-bold text-blue-600 text-sm pt-2 border-t border-border">
                <span>Amount to Pay:</span>
                <span>₹{payoutModalBooking.ownerRemaining?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary block">Transaction / Bank UTR Number</label>
              <input
                type="text"
                placeholder="e.g. UTR49201948201 or UPI/1029482019"
                value={payoutTxnId}
                onChange={(e) => setPayoutTxnId(e.target.value)}
                className="w-full p-3 bg-surface border border-border rounded-xl text-xs font-bold text-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setPayoutModalBooking(null)} className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={() => settlePayoutMutation.mutate({ bookingId: payoutModalBooking.id, txnId: payoutTxnId || `utr_${Date.now()}` })}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Mark ₹{payoutModalBooking.ownerRemaining?.toLocaleString("en-IN")} as Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDED TASK MODAL 3: Record Owner Payment to StayGrid */}
      {recordPaymentModalBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-purple-600 flex items-center gap-2">
                🔴 Record Owner Payment to StayGrid
              </h3>
              <button onClick={() => setRecordPaymentModalBooking(null)} className="p-1 rounded-full hover:bg-border/40">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <p className="text-xs text-muted font-medium">
              Owner collected 100% cash and owes StayGrid <strong>₹{Math.abs(recordPaymentModalBooking.ownerRemaining)?.toLocaleString("en-IN")}</strong> commission.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary block">Payment / UTR Reference Number</label>
              <input
                type="text"
                placeholder="e.g. UPI/1092849102"
                value={recordPaymentTxnId}
                onChange={(e) => setRecordPaymentTxnId(e.target.value)}
                className="w-full p-3 bg-surface border border-border rounded-xl text-xs font-bold text-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setRecordPaymentModalBooking(null)} className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={() => recordOwnerPaymentMutation.mutate({ bookingId: recordPaymentModalBooking.id, txnId: recordPaymentTxnId || `pay_rec_${Date.now()}` })}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Record Payment & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDED TASK MODAL 4: Refund Customer */}
      {refundModalBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-rose-600 flex items-center gap-2">
                🔄 Refund Customer
              </h3>
              <button onClick={() => setRefundModalBooking(null)} className="p-1 rounded-full hover:bg-border/40">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-primary">
                <span>Customer:</span>
                <span>{refundModalBooking.user?.name}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Originally Paid:</span>
                <span>₹{refundModalBooking.staygridReceived?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 pt-2 border-t border-rose-500/20">
                <span>Recommended Refund:</span>
                <span>₹{refundModalBooking.policyRecommendedRefund?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOverrideRefund}
                  onChange={(e) => {
                    setIsOverrideRefund(e.target.checked);
                    if (e.target.checked && customRefundAmount === 0) {
                      setCustomRefundAmount(refundModalBooking.staygridReceived || 2000);
                    }
                  }}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                  Give a different amount? (Customer Exception)
                </span>
              </label>

              {isOverrideRefund && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-muted block mb-1">Custom Refund Amount (₹)</label>
                    <input
                      type="number"
                      value={customRefundAmount}
                      onChange={(e) => setCustomRefundAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm font-bold text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted block mb-1">Approval Reason</label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-primary font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setRefundModalBooking(null)} className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={() => settleRefundMutation.mutate({
                  bookingId: refundModalBooking.id,
                  refundAmount: isOverrideRefund ? customRefundAmount : (refundModalBooking.policyRecommendedRefund || 0),
                  isOverride: isOverrideRefund,
                  reason: refundReason,
                  txnId: refundTxnId,
                })}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm ₹{isOverrideRefund ? customRefundAmount : (refundModalBooking.policyRecommendedRefund || 0)} Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDED TASK MODAL 5: Change StayGrid's Share */}
      {shareModalBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
                ✏️ Change StayGrid's Share
              </h3>
              <button onClick={() => setShareModalBooking(null)} className="p-1 rounded-full hover:bg-border/40">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-primary block mb-1">Why do you want to change it?</label>
                <select
                  value={shareReason}
                  onChange={(e) => setShareReason(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-primary"
                >
                  <option value="Video/Reel Production">Video/Reel Production Agreement</option>
                  <option value="Special Owner Agreement">Special Owner Agreement</option>
                  <option value="Promotional Deal">Promotional Deal</option>
                  <option value="Other Exception">Other Exception</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-primary block mb-1">New StayGrid Share (%)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[0, 14, 18, 20, 30, 35].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setNewSharePercentage(pct)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        newSharePercentage === pct ? "bg-blue-600 text-white border-blue-600" : "bg-surface border-border"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={newSharePercentage}
                  onChange={(e) => setNewSharePercentage(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm font-bold text-primary"
                />
              </div>

              {/* Exact Plain Impact Explanation */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">This changes:</div>
                <div className="text-muted">
                  StayGrid earns: ₹{((shareModalBooking.totalAmount * shareModalBooking.commissionPercentage) / 100).toLocaleString("en-IN")} → <strong>₹{((shareModalBooking.totalAmount * newSharePercentage) / 100).toLocaleString("en-IN")}</strong>
                </div>
                <div className="text-muted">
                  Owner receives: ₹{((shareModalBooking.totalAmount * (100 - shareModalBooking.commissionPercentage)) / 100).toLocaleString("en-IN")} → <strong>₹{((shareModalBooking.totalAmount * (100 - newSharePercentage)) / 100).toLocaleString("en-IN")}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShareModalBooking(null)} className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={() => updateShareMutation.mutate({
                  bookingId: shareModalBooking.id,
                  commissionPercentage: newSharePercentage,
                  reason: shareReason,
                  notes: shareNotes,
                })}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
