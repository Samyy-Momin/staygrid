import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Calendar, MapPin, CheckCircle2, XCircle, Clock, History, Bookmark, X, ArrowRight } from "lucide-react-native";
import { api } from "../../lib/authApi";
import { getFullImageUrl } from "../../lib/config";
import { useThemeColors } from "../../lib/theme-colors";

export default function BookingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals for History and Saved Drafts
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await api.get("/api/bookings/me");
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const now = new Date();

  // Filter Bookings safely
  const upcomingBookings = bookings.filter((b) => {
    if (!b) return false;
    if (b.status === 'CANCELLED' || b.status === 'SAVED') return false;
    const checkOutDate = b.checkOut ? new Date(b.checkOut) : null;
    return checkOutDate && checkOutDate >= now;
  });

  const historyBookings = bookings.filter((b) => {
    if (!b) return false;
    if (b.status === 'CANCELLED') return true;
    const checkOutDate = b.checkOut ? new Date(b.checkOut) : null;
    return checkOutDate && checkOutDate < now && b.status !== 'SAVED';
  });

  const savedBookings = bookings.filter((b) => b && b.status === 'SAVED');

  const getStatusConfig = (status: string, isPast: boolean) => {
    if (status === 'CANCELLED') {
      return { bg: 'bg-danger/10', text: 'text-danger', label: 'Cancelled', icon: <XCircle size={12} color="#EF4444" /> };
    }
    if (status === 'CONFIRMED' && !isPast) {
      return { bg: 'bg-success/10', text: 'text-success', label: 'Confirmed', icon: <CheckCircle2 size={12} color="#10B981" /> };
    }
    if (status === 'SAVED') {
      return { bg: 'bg-accent-blue/10', text: 'text-accent-blue', label: 'Saved Draft', icon: <Bookmark size={12} color="#0066CC" /> };
    }
    if (isPast) {
      return { bg: 'bg-surface dark:bg-border', text: 'text-text-muted', label: 'Completed', icon: <Clock size={12} color="#9B9B9B" /> };
    }
    return { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending Payment', icon: <Clock size={12} color="#F59E0B" /> };
  };

  const formatDateStr = (dateVal: any) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCardPress = (item: any) => {
    if (item.status === 'PENDING_PAYMENT' || item.status === 'SAVED') {
      // Resume payment
      const checkInDate = item.checkIn ? new Date(item.checkIn).toISOString().split('T')[0] : '';
      const checkOutDate = item.checkOut ? new Date(item.checkOut).toISOString().split('T')[0] : '';
      router.push(`/checkout/${item.farmhouseId}?start=${checkInDate}&end=${checkOutDate}&type=12H&adults=${item.adults || 2}&children=${item.children || 0}`);
    } else {
      router.push(`/farmhouse/${item.farmhouseId}`);
    }
  };

  const renderBookingCard = ({ item }: { item: any }) => {
    if (!item) return null;
    const isPast = item.checkOut ? new Date(item.checkOut) < now : false;
    const statusConfig = getStatusConfig(item.status, isPast);
    const checkInDate = formatDateStr(item.checkIn);
    const checkOutDate = formatDateStr(item.checkOut);
    const totalGuests = (item.adults || 0) + (item.children || 0) || 20;
    const tokenPaid = item.tokenPaid || 2000;
    const balance = Math.max(0, (item.totalAmount || 0) - tokenPaid);

    return (
      <TouchableOpacity 
        className="bg-surface dark:bg-surface rounded-[28px] overflow-hidden mb-6 border border-border dark:border-border shadow-md"
        onPress={() => handleCardPress(item)}
        activeOpacity={0.9}
      >
        {/* Top Hero Image Banner */}
        <View className="relative w-full h-44">
          <Image 
            source={{ uri: getFullImageUrl(item.farmhouse?.photos?.[0] || item.farmhouse?.images?.[0]) }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
          <View className="absolute inset-0 bg-black/10" />
        </View>

        {/* Boarding Pass Header Row */}
        <View className="p-5 pb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-[Inter_800ExtraBold] text-[#0066CC] uppercase tracking-widest">
              BOARDING PASS
            </Text>
            <View className={`px-3 py-1 rounded-full border ${item.status === 'CONFIRMED' ? 'border-[#10B981] bg-[#10B981]/10' : 'border-[#0066CC] bg-[#0066CC]/10'}`}>
              <Text className={`text-[10px] font-[Inter_800ExtraBold] uppercase tracking-wider ${item.status === 'CONFIRMED' ? 'text-[#10B981]' : 'text-[#0066CC]'}`}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Property Title */}
          <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface leading-tight mb-4 tracking-tight" numberOfLines={1}>
            {item.farmhouse?.title || "The Ivory Estate"}
          </Text>

          {/* 3-Column Key Stay Details */}
          <View className="flex-row justify-between items-center py-2">
            <View className="flex-1">
              <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase tracking-wider mb-1">
                CHECK-IN
              </Text>
              <Text className="text-sm font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                {checkInDate}
              </Text>
            </View>

            <View className="w-px h-8 bg-border dark:bg-border mx-3" />

            <View className="flex-1">
              <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase tracking-wider mb-1">
                CHECK-OUT
              </Text>
              <Text className="text-sm font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                {checkOutDate}
              </Text>
            </View>

            <View className="w-px h-8 bg-border dark:bg-border mx-3" />

            <View className="w-16 items-end">
              <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase tracking-wider mb-1">
                GUESTS
              </Text>
              <Text className="text-sm font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
                {totalGuests}
              </Text>
            </View>
          </View>
        </View>

        {/* Perforated Dashed Line Divider with Side Notches */}
        <View className="relative w-full my-1 flex-row items-center justify-between">
          <View className="w-5 h-5 bg-[#F3F4F6] dark:bg-[#09090B] rounded-r-full -ml-2.5 z-10 border-t border-r border-b border-border dark:border-border" />
          <View className="flex-1 h-0 border-b border-dashed border-[#0066CC]/30 mx-2" />
          <View className="w-5 h-5 bg-[#F3F4F6] dark:bg-[#09090B] rounded-l-full -mr-2.5 z-10 border-t border-l border-b border-border dark:border-border" />
        </View>

        {/* Bottom Section: Token Paid, Balance & View Button */}
        <View className="p-5 pt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase tracking-wider mb-0.5">
              TOKEN PAID
            </Text>
            <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
              ₹{tokenPaid.toLocaleString('en-IN')}
            </Text>
          </View>

          <View className="ml-4">
            <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase tracking-wider mb-0.5">
              BALANCE
            </Text>
            <Text className="text-base font-[Inter_800ExtraBold] text-[#10B981]">
              ₹{balance.toLocaleString('en-IN')}
            </Text>
          </View>

          <TouchableOpacity
            className="ml-auto bg-[#0066CC] px-7 py-3 rounded-full shadow-md items-center justify-center"
            onPress={() => handleCardPress(item)}
          >
            <Text className="text-white font-[Inter_800ExtraBold] text-sm">
              {item.status === 'PENDING_PAYMENT' || item.status === 'SAVED' ? 'Pay Token' : 'View'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface" edges={['top']}>
      {/* Top Header with Title and Action Icons */}
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">
            My Bookings
          </Text>
          <Text className="text-xs text-text-muted font-[Inter_500Medium]">
            Upcoming stays & draft reservations
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Saved Bookings Icon Button */}
          <TouchableOpacity 
            onPress={() => setShowSavedModal(true)}
            className="w-11 h-11 bg-surface dark:bg-border rounded-full items-center justify-center border border-border dark:border-border relative"
          >
            <Bookmark size={20} color={colors.textPrimary} />
            {savedBookings.length > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-[#0066CC] rounded-full items-center justify-center">
                <Text className="text-[10px] font-[Inter_700Bold] text-white">{savedBookings.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* History Icon Button */}
          <TouchableOpacity 
            onPress={() => setShowHistoryModal(true)}
            className="w-11 h-11 bg-surface dark:bg-border rounded-full items-center justify-center border border-border dark:border-border"
          >
            <History size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content: Upcoming Bookings List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accentPrimary} />
        </View>
      ) : (
        <FlatList
          data={upcomingBookings}
          keyExtractor={(item, idx) => (item?.id ? String(item.id) : String(idx))}
          renderItem={renderBookingCard}
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066CC" />}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-16">
              <View className="w-24 h-24 bg-surface dark:bg-border rounded-full items-center justify-center mb-6 border border-border dark:border-border">
                <Calendar size={40} color="#9B9B9B" />
              </View>
              <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface mb-2">
                No Upcoming Stays
              </Text>
              <Text className="text-text-muted font-[Inter_400Regular] text-center px-8 mb-6">
                You don't have any active upcoming stays right now. Tap below to explore available farmhouses!
              </Text>
              
              <TouchableOpacity 
                className="bg-[#10B981] px-8 py-4 rounded-2xl shadow-md"
                onPress={() => router.push('/(tabs)/home')}
              >
                <Text className="text-white font-[Inter_700Bold] text-base">Explore Farmhouses</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* HISTORY MODAL */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={false}>
        <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
          <View className="px-6 py-4 flex-row justify-between items-center border-b border-border dark:border-border">
            <View className="flex-row items-center">
              <History size={24} color="#0066CC" className="mr-3" />
              <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface ml-2">Booking History</Text>
            </View>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)} className="p-2 bg-surface dark:bg-border rounded-full">
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={historyBookings}
            keyExtractor={(item, idx) => (item?.id ? String(item.id) : String(idx))}
            renderItem={renderBookingCard}
            contentContainerStyle={{ padding: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20">
                <Text className="text-base font-[Inter_600SemiBold] text-text-muted">No past or cancelled bookings found.</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* SAVED DRAFTS MODAL */}
      <Modal visible={showSavedModal} animationType="slide" transparent={false}>
        <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
          <View className="px-6 py-4 flex-row justify-between items-center border-b border-border dark:border-border">
            <View className="flex-row items-center">
              <Bookmark size={24} color="#0066CC" className="mr-3" />
              <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface ml-2">Saved Draft Bookings</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSavedModal(false)} className="p-2 bg-surface dark:bg-border rounded-full">
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={savedBookings}
            keyExtractor={(item, idx) => (item?.id ? String(item.id) : String(idx))}
            renderItem={({ item }) => (
              <View className="bg-surface dark:bg-surface rounded-3xl p-4 mb-4 border border-border dark:border-border shadow-sm">
                <View className="flex-row items-center mb-3">
                  <Image 
                    source={{ uri: getFullImageUrl(item.farmhouse?.photos?.[0] || item.farmhouse?.images?.[0]) }} 
                    className="w-16 h-16 rounded-2xl mr-3" 
                    resizeMode="cover" 
                  />
                  <View className="flex-1">
                    <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface">{item.farmhouse?.title}</Text>
                    <Text className="text-xs text-text-muted">{formatDateStr(item.checkIn)} - {formatDateStr(item.checkOut)}</Text>
                    <Text className="text-sm font-[Inter_800ExtraBold] text-[#0066CC] mt-1">Token: ₹{item.tokenPaid || 2000}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  className="bg-[#10B981] py-3 rounded-xl items-center flex-row justify-center"
                  onPress={() => {
                    setShowSavedModal(false);
                    handleCardPress(item);
                  }}
                >
                  <Text className="text-white font-[Inter_700Bold] text-sm mr-2">Complete Payment & Confirm</Text>
                  <ArrowRight size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ padding: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20">
                <Text className="text-base font-[Inter_600SemiBold] text-text-muted">No saved draft bookings.</Text>
                <Text className="text-xs text-text-muted text-center mt-2 px-8">When reviewing a booking on checkout, tap "Save for Later" to store it here.</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
