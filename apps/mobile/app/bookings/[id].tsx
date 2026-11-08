import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, MapPin, Phone, ShieldCheck, CheckCircle2, AlertTriangle, FileText, XCircle } from "lucide-react-native";
import { api } from "../../lib/authApi";
import { getFullImageUrl } from "../../lib/config";
import { useThemeColors } from "../../lib/theme-colors";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  const fetchBooking = async () => {
    try {
      setIsUnauthenticated(false);
      const res = await api.get("/api/bookings/me");
      const list = Array.isArray(res.data) ? res.data : [];
      const match = list.find((b: any) => String(b.id) === String(id));
      setBooking(match || null);
    } catch (err: any) {
      if (err?.message?.includes("Authentication required") || err?.response?.status === 401) {
        setIsUnauthenticated(true);
      } else {
        console.error("Failed to fetch booking detail", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center">
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </SafeAreaView>
    );
  }

  if (isUnauthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center p-6">
        <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface text-center mb-2">Login Required</Text>
        <Text className="text-sm text-text-muted font-[Inter_500Medium] text-center mb-6 px-4">Please log in to view your booking ticket details.</Text>
        <TouchableOpacity className="bg-[#0066CC] px-8 py-3.5 rounded-full" onPress={() => router.push("/auth/login")}>
          <Text className="text-white font-[Inter_700Bold]">Log In / Sign Up</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center p-6">
        <Text className="text-base text-text-muted font-[Inter_500Medium] text-center mb-4">Booking ticket not found.</Text>
        <TouchableOpacity className="bg-accent-primary px-6 py-3 rounded-xl" onPress={() => router.back()}>
          <Text className="text-white font-[Inter_700Bold]">Return to Bookings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const farmhouse = booking.farmhouse || {};
  const tokenPaid = booking.tokenPaid || 0;
  const totalAmount = booking.totalAmount || 0;
  const balanceDue = Math.max(0, totalAmount - tokenPaid);

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateVal: any) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCallHost = () => {
    const phoneNum = farmhouse.owner?.phone || farmhouse.contactPhone || "+918983310858";
    Linking.openURL(`tel:${phoneNum}`);
  };

  const handleOpenMaps = () => {
    const query = encodeURIComponent(farmhouse.address || farmhouse.title || "Bhiwandi, Maharashtra");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleConfirmCash = async () => {
    try {
      await api.patch(`/api/bookings/${booking.id}/confirm-cash`);
      Alert.alert("Cash Payment Marked", "You have marked cash payment as completed.");
      fetchBooking();
    } catch (err: any) {
      Alert.alert("Action Failed", err.response?.data?.message || "Failed to update payment.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface" edges={['top', 'left', 'right']}>
      {/* Top Bar Navigation */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border dark:border-border">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/bookings')} 
            className="w-10 h-10 items-center justify-center rounded-full bg-surface dark:bg-border/60 border border-border/60 mr-3"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">Booking Ticket</Text>
        </View>
        <View className={`px-3 py-1 rounded-full border ${booking.status === 'CONFIRMED' ? 'bg-[#10B981]/15 border-[#10B981]/30' : (booking.status === 'CANCELLED' ? 'bg-danger/15 border-danger/30' : 'bg-warning/15 border-warning/30')}`}>
          <Text className={`text-xs font-[Inter_800ExtraBold] uppercase ${booking.status === 'CONFIRMED' ? 'text-[#10B981]' : (booking.status === 'CANCELLED' ? 'text-danger' : 'text-warning')}`}>
            {booking.status}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Ticket Boarding Pass Hero Container */}
        <View className="bg-surface dark:bg-surface rounded-3xl overflow-hidden border border-border dark:border-border shadow-lg mb-6">
          <View className="relative h-44 w-full">
            <Image 
              source={{ uri: getFullImageUrl(farmhouse.photos?.[0] || farmhouse.images?.[0]) }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/30" />
            <View className="absolute bottom-3 left-4 right-4 flex-row justify-between items-end">
              <View className="flex-1 mr-2">
                <Text className="text-white font-[Inter_800ExtraBold] text-xl leading-tight" numberOfLines={1}>
                  {farmhouse.title || "StayGrid Farmhouse"}
                </Text>
                <Text className="text-white/80 font-[Inter_500Medium] text-xs">
                  {farmhouse.city || farmhouse.address || "Bhiwandi, Maharashtra"}
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket Body Content */}
          <View className="p-5">
            <Text className="text-[10px] font-[Inter_800ExtraBold] text-[#0066CC] uppercase tracking-widest mb-3">STAY RESERVATION DETAILS</Text>

            {/* Check-in / Check-out Grid with non-overlapping dates and times */}
            <View className="flex-row justify-between items-center bg-surface/50 dark:bg-surface/50 p-4 rounded-2xl border border-border dark:border-border mb-4">
              <View className="flex-1 pr-2">
                <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase mb-1">CHECK-IN</Text>
                <Text className="text-sm font-[Inter_800ExtraBold] text-text-primary dark:text-surface" numberOfLines={1}>
                  {formatDate(booking.checkIn)}
                </Text>
                <Text className="text-xs text-[#0066CC] font-[Inter_700Bold] mt-1" numberOfLines={1}>
                  {formatTime(booking.checkIn) || '10:00 AM'}
                </Text>
              </View>
              <View className="w-px h-10 bg-border dark:bg-border mx-2" />
              <View className="flex-1 pl-2">
                <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase mb-1">CHECK-OUT</Text>
                <Text className="text-sm font-[Inter_800ExtraBold] text-text-primary dark:text-surface" numberOfLines={1}>
                  {formatDate(booking.checkOut)}
                </Text>
                <Text className="text-xs text-[#0066CC] font-[Inter_700Bold] mt-1" numberOfLines={1}>
                  {formatTime(booking.checkOut) || '9:00 PM'}
                </Text>
              </View>
            </View>

            {/* Guest Summary */}
            <View className="flex-row justify-between items-center py-2 border-b border-border/40 mb-4">
              <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">Guests</Text>
              <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">
                {booking.adults || 2} Adults, {booking.children || 0} Children
              </Text>
            </View>

            {/* Host Info */}
            <View className="flex-row justify-between items-center py-2 border-b border-border/40 mb-4">
              <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">Host</Text>
              <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">
                {farmhouse.hostName || farmhouse.owner?.name || "StayGrid Host"}
              </Text>
            </View>

            {/* Reference Ticket ID */}
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">Booking Reference</Text>
              <Text className="text-xs font-[Inter_800ExtraBold] text-[#0066CC]">
                #STAY-{String(booking.id).substring(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Perforated Notches Line */}
          <View className="relative w-full my-1 flex-row items-center justify-between">
            <View className="w-5 h-5 bg-[#F3F4F6] dark:bg-[#09090B] rounded-r-full -ml-2.5 z-10 border-t border-r border-b border-border dark:border-border" />
            <View className="flex-1 h-0 border-b border-dashed border-[#0066CC]/30 mx-2" />
            <View className="w-5 h-5 bg-[#F3F4F6] dark:bg-[#09090B] rounded-l-full -mr-2.5 z-10 border-t border-l border-b border-border dark:border-border" />
          </View>

          {/* Payment Breakdown Bottom */}
          <View className="p-5 pt-3">
            <Text className="text-[10px] font-[Inter_800ExtraBold] text-text-muted uppercase tracking-widest mb-3">PAYMENT BREAKDOWN</Text>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs text-text-muted font-[Inter_500Medium]">Total Stay Price</Text>
              <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs text-[#10B981] font-[Inter_700Bold]">Token Paid Online (50%)</Text>
              <Text className="text-sm font-[Inter_800ExtraBold] text-[#10B981]">₹{tokenPaid.toLocaleString('en-IN')}</Text>
            </View>

            <View className="flex-row justify-between items-center pt-2 border-t border-border/40 mt-2">
              <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface">Remaining Cash Due</Text>
              <Text className="text-lg font-[Inter_800ExtraBold] text-[#0066CC]">₹{balanceDue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View className="space-y-3 mb-8">
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 bg-[#0066CC] py-3.5 rounded-2xl flex-row items-center justify-center shadow-sm"
              onPress={handleCallHost}
            >
              <Phone size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="text-white font-[Inter_700Bold] text-sm">Call Host</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-surface dark:bg-surface border border-border dark:border-border py-3.5 rounded-2xl flex-row items-center justify-center shadow-sm"
              onPress={handleOpenMaps}
            >
              <MapPin size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-sm">Get Directions</Text>
            </TouchableOpacity>
          </View>

          {/* Cash Confirmation Button */}
          {balanceDue > 0 && booking.status === 'CONFIRMED' && (
            <TouchableOpacity 
              className={`py-3.5 rounded-2xl flex-row items-center justify-center border ${booking.cashPaymentConfirmedByUser ? 'bg-[#10B981]/15 border-[#10B981]/30' : 'bg-surface border-border'}`}
              onPress={handleConfirmCash}
              disabled={booking.cashPaymentConfirmedByUser}
            >
              <CheckCircle2 size={18} color={booking.cashPaymentConfirmedByUser ? '#10B981' : colors.textPrimary} style={{ marginRight: 8 }} />
              <Text className={`font-[Inter_700Bold] text-sm ${booking.cashPaymentConfirmedByUser ? 'text-[#10B981]' : 'text-text-primary'}`}>
                {booking.cashPaymentConfirmedByUser ? '✓ Cash Payment Marked' : 'Mark Cash Payment as Paid'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancellation Option */}
          {booking.status === 'CONFIRMED' && (
            <TouchableOpacity 
              className="py-3.5 rounded-2xl flex-row items-center justify-center bg-[#EF4444]/10 border border-[#EF4444]/20"
              onPress={() => router.push({ pathname: "/bookings/cancel", params: { bookingId: booking.id } })}
            >
              <XCircle size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="text-[#EF4444] font-[Inter_700Bold] text-sm">Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
