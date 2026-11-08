import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Calendar, Edit3, Star, Minus, Plus, Users } from "lucide-react-native";
import { api, authApi } from "../../lib/authApi";
import { getFullImageUrl } from "../../lib/config";
import { WebView } from "react-native-webview";
import { useThemeColors } from "../../lib/theme-colors";
import { StayGridTextField, StayGridTextArea } from "../../components/ui/StayGridTextField";
import { mixpanel } from "../../lib/mixpanel";

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const { id, start, end, type, time, adults, children, extraFee } = params;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [farmhouse, setFarmhouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const [guestCount, setGuestCount] = useState<number>(parseInt(adults as string || '20', 10));
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const colors = useThemeColors();

  useEffect(() => {
    authApi.getSession().then((session: any) => {
      if (session?.user?.email) setEmail(session.user.email);
      if (session?.user?.phone) setPhone(session.user.phone);
    });

    if (id) {
      api.get(`/api/farmhouses/${id}`)
        .then((res: any) => setFarmhouse(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));

      // Silent INITIATE_CHECKOUT Event Logging
      api.post(`/api/admin/marketing/event`, {
        farmhouseId: id as string,
        eventType: "INITIATE_CHECKOUT",
      }).catch(() => null);
    }
  }, [id]);

  const parsedAdults = parseInt(adults as string, 10) || 1;
  const parsedChildren = parseInt(children as string, 10) || 0;
  const parsedExtraFee = parseFloat(extraFee as string) || 0;

  let nights = 0;
  if (start && end) {
    const startDateObj = new Date(start as string);
    const endDateObj = new Date(end as string);
    nights = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24));
  }

  let subtotalAmount = 0;
  if (farmhouse) {
    const isWeekend = (() => {
      if (!start) return false;
      const d = new Date(start as string).getDay();
      return d === 0 || d === 6;
    })();

    if (type === '12H') {
      subtotalAmount = isWeekend
        ? (farmhouse.weekendPrice12Hours || farmhouse.price12Hours || 0)
        : (farmhouse.price12Hours || 0);
    } else if (type === '24H') {
      subtotalAmount = isWeekend
        ? (farmhouse.weekendPrice24Hours || farmhouse.price24Hours || 0)
        : (farmhouse.price24Hours || 0);
    } else {
      const perNight = isWeekend
        ? (farmhouse.weekendPrice24Hours || farmhouse.price24Hours || 0)
        : (farmhouse.price24Hours || 0);
      subtotalAmount = nights === 0
        ? (isWeekend ? (farmhouse.weekendPrice12Hours || farmhouse.price12Hours || 0) : (farmhouse.price12Hours || 0))
        : nights * perNight;
    }
  }
  
  const totalAmount = subtotalAmount + parsedExtraFee;
  const tokenAmount = farmhouse?.tokenAmount || 2000; 
  const remainingDue = Math.max(0, totalAmount - tokenAmount);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
  };

  const formatToISO = (dateString: string, timeString: string) => {
    if (!timeString) return `${dateString}T12:00:00.000Z`;
    const parts = timeString.trim().split(' ');
    const timeParts = parts[0].split(':');
    let hours = parseInt(timeParts[0], 10) || 12;
    const minutes = (timeParts[1] || '00').padStart(2, '0');
    const modifier = parts[1] ? parts[1].toUpperCase() : 'AM';

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return `${dateString}T${hours.toString().padStart(2, '0')}:${minutes}:00.000Z`;
  };

  const handlePay = async () => {
    setBookingLoading(true);

    const combinedCheckIn = formatToISO(start as string, time as string);
    let combinedCheckOut: string;
    if (type === '12H') {
      const checkOutDate = new Date(new Date(combinedCheckIn).getTime() + 12 * 60 * 60 * 1000);
      combinedCheckOut = checkOutDate.toISOString();
    } else if (type === '24H') {
      const checkOutDate = new Date(new Date(combinedCheckIn).getTime() + 24 * 60 * 60 * 1000);
      combinedCheckOut = checkOutDate.toISOString();
    } else {
      combinedCheckOut = formatToISO(end as string, '10:00 AM');
    }

    try {
      const session = await authApi.getSession();
      if (!session) {
        Alert.alert(
          "Login Required",
          "You must be logged in to book a farmhouse.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Log In", onPress: () => router.push("/auth/login") }
          ]
        );
        setBookingLoading(false);
        return;
      }
      
      const bookingPayload: any = {
        farmhouseId: id,
        checkIn: combinedCheckIn,
        checkOut: combinedCheckOut,
        adults: parsedAdults,
        children: parsedChildren,
      };
      if (typeof notes === 'string' && notes.trim().length > 0) {
        bookingPayload.notes = notes.trim();
      }

      const res = await api.post("/api/bookings", bookingPayload);
      
      setRazorpayOrder({
        orderId: res.data.razorpayOrderId || `order_${res.data.id?.substring(0,8)}`,
        amount: tokenAmount * 100,
        bookingId: res.data.id,
      });

      await mixpanel.track("booking_initiated", {
        booking_id: res.data.id,
        farmhouse_id: id,
        farmhouse_title: farmhouse?.title,
        total_amount: totalStayPrice,
        token_amount: tokenAmount,
        check_in: combinedCheckIn,
        check_out: combinedCheckOut,
        adults: parsedAdults,
        children: parsedChildren,
      });
    } catch (err: any) {
      console.error("Booking error details:", err.response?.data || err);
      const backendMsg = err.response?.data?.message;
      const displayMsg = Array.isArray(backendMsg) 
        ? backendMsg.join('\n') 
        : (typeof backendMsg === 'string' ? backendMsg : (err.message || "Something went wrong"));
      Alert.alert("Booking Failed", displayMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSaveForLater = async () => {
    setBookingLoading(true);

    const combinedCheckIn = formatToISO(start as string, time as string);
    let combinedCheckOut: string;
    if (type === '12H') {
      const checkOutDate = new Date(new Date(combinedCheckIn).getTime() + 12 * 60 * 60 * 1000);
      combinedCheckOut = checkOutDate.toISOString();
    } else if (type === '24H') {
      const checkOutDate = new Date(new Date(combinedCheckIn).getTime() + 24 * 60 * 60 * 1000);
      combinedCheckOut = checkOutDate.toISOString();
    } else {
      combinedCheckOut = formatToISO(end as string, '10:00 AM');
    }

    try {
      const bookingPayload: any = {
        farmhouseId: id,
        checkIn: combinedCheckIn,
        checkOut: combinedCheckOut,
        adults: parsedAdults,
        children: parsedChildren,
      };
      if (typeof notes === 'string' && notes.trim().length > 0) {
        bookingPayload.notes = notes.trim();
      }

      await api.post("/api/bookings/save", bookingPayload);
      Alert.alert(
        "Booking Saved!",
        "Your draft booking has been saved for later. You can view and pay token amount anytime under My Bookings.",
        [{ text: "View Saved Bookings", onPress: () => router.push("/bookings") }]
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert("Save Failed", err.response?.data?.message || "Could not save booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  const [completedBookingId, setCompletedBookingId] = useState<string>("");

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'payment_success') {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data.data;
        
        const verifyRes = await api.post("/api/bookings/verify", {
          razorpayPaymentId: razorpay_payment_id || `pay_test_${Date.now()}`,
          razorpayOrderId: razorpay_order_id || razorpayOrder?.orderId,
          razorpaySignature: razorpay_signature || 'dummy_sig',
        });

        const confirmedId = verifyRes?.data?.bookingId || razorpayOrder?.bookingId;
        if (confirmedId) {
          setCompletedBookingId(confirmedId);
        }

        await mixpanel.track("booking_confirmed", {
          booking_id: confirmedId,
          farmhouse_id: id,
          farmhouse_title: farmhouse?.title,
          total_amount: totalStayPrice,
          token_paid: tokenAmount,
          adults: parsedAdults,
          children: parsedChildren,
          payment_id: razorpay_payment_id,
        });

        setPaymentSuccess(true);
        setRazorpayOrder(null);
      } else if (data.event === 'payment_dismiss') {
        setRazorpayOrder(null); 
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Verification Error", "Failed to verify payment with server.");
      setRazorpayOrder(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center">
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </SafeAreaView>
    );
  }

  if (paymentSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center p-6">
        <View className="w-24 h-24 bg-success/15 rounded-full items-center justify-center mb-4 border border-success/30">
          <CheckCircle2 size={56} color="#10B981" />
        </View>
        <Text className="text-3xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-1 text-center">
          🎉 Congratulations!
        </Text>
        <Text className="text-lg font-[Inter_700Bold] text-success mb-4 text-center">
          Booking Confirmed — Token Paid!
        </Text>
        
        {/* Booking Summary Box */}
        <View className="w-full bg-surface dark:bg-surface p-5 rounded-3xl border border-border dark:border-border mb-6 shadow-sm">
          <Text className="text-lg font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-1" numberOfLines={1}>
            {farmhouse?.title || "StayGrid Farmhouse"}
          </Text>
          <Text className="text-xs text-text-muted font-[Inter_500Medium] mb-4">
            {farmhouse?.city || "Bhiwandi, Maharashtra"}
          </Text>

          <View className="flex-row justify-between items-center bg-surface/50 dark:bg-border/30 p-3 rounded-2xl border border-border/40">
            <View>
              <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">TOKEN PAID</Text>
              <Text className="text-sm font-[Inter_800ExtraBold] text-[#10B981] mt-0.5">₹{tokenAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-[Inter_700Bold] text-text-muted uppercase">REMAINING DUE</Text>
              <Text className="text-sm font-[Inter_800ExtraBold] text-[#0066CC] mt-0.5">₹{remainingDue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-[#0066CC] w-full py-4 rounded-2xl items-center mb-3 shadow-md"
          onPress={() => router.replace({ pathname: "/checkout/social-follow", params: { farmhouseId: id, bookingId: completedBookingId || razorpayOrder?.bookingId } })}
        >
          <Text className="text-white font-[Inter_700Bold] text-base">Accept Guidelines & Continue →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (razorpayOrder) {
    const htmlContent = `
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="background-color: #f8fafc; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
      <h2 style="font-family: system-ui, sans-serif; color: #0066CC; margin-bottom: 8px;">StayGrid Secure Payment</h2>
      <p style="font-family: system-ui, sans-serif; color: #64748b; font-size: 14px; margin-bottom: 24px;">Opening gateway for Token Payment (₹${tokenAmount})...</p>
      <button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'payment_success', data: { razorpay_payment_id: 'pay_sim_' + Date.now(), razorpay_order_id: '${razorpayOrder.orderId}', razorpay_signature: 'sim_sig' } }))" style="padding: 16px 32px; background: #10B981; color: white; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">Confirm & Pay Token Now →</button>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script>
      setTimeout(() => {
        try {
          var options = {
            "key": "rzp_test_T99KZjkGQn4lMz", 
            "amount": "${razorpayOrder.amount}",
            "currency": "INR",
            "name": "StayGrid Booking",
            "description": "Token Payment for Farmhouse Booking",
            "order_id": "${razorpayOrder.orderId}",
            "handler": function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'payment_success', data: response }));
            },
            "theme": { "color": "#0066CC" },
            "modal": { "ondismiss": function(){ window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'payment_dismiss' })); } }
          };
          var rzp1 = new Razorpay(options);
          rzp1.open();
        } catch (e) { console.log('Razorpay JS fallback active'); }
      }, 600);
      </script>
    </body>
    </html>
    `;

    return (
      <SafeAreaView className="flex-1 bg-surface">
        <WebView 
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
        />
        <TouchableOpacity 
          className="m-4 p-4 bg-[#10B981] rounded-2xl items-center shadow-md"
          onPress={() => handleWebViewMessage({ nativeEvent: { data: JSON.stringify({ event: 'payment_success', data: { razorpay_payment_id: `pay_test_${Date.now()}`, razorpay_order_id: razorpayOrder.orderId, razorpay_signature: 'dummy_sig' } }) } })}
        >
          <Text className="text-white font-[Inter_700Bold] text-base">Complete Test Payment (Demo Mode)</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
          <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Confirm & Pay</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        {/* Farmhouse Card */}
        <View className="bg-surface dark:bg-surface rounded-3xl p-3 flex-row items-center shadow-sm mb-6 mt-2 border border-border">
          <Image 
            source={{ uri: getFullImageUrl(farmhouse?.photos?.[0]) }} 
            className="w-24 h-24 rounded-2xl" 
            resizeMode="cover" 
          />
          <View className="ml-4 flex-1">
            <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface mb-1" numberOfLines={1}>{farmhouse?.title}</Text>
            <Text className="text-xs text-text-muted font-[Inter_500Medium] mb-2">{farmhouse?.city || "Bhiwandi, Maharashtra"}</Text>
            <View className="flex-row items-center">
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-xs font-[Inter_700Bold] text-text-primary dark:text-surface ml-1">4.9 (12 reviews)</Text>
            </View>
          </View>
        </View>

        {/* Stay Summary Card */}
        <Text className="text-lg font-[Inter_600SemiBold] text-text-primary dark:text-surface mb-4">Your Trip</Text>
        
        <View className="bg-surface dark:bg-surface rounded-3xl p-4 mb-4 border border-border dark:border-border shadow-sm">
          <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-border dark:border-border">
            <View className="flex-row items-center">
              <Calendar size={18} color="#0066CC" />
              <Text className="font-[Inter_600SemiBold] text-text-primary dark:text-surface ml-2">Dates</Text>
            </View>
            <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface">
              {formatDate(start as string)} - {formatDate(end as string)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Calendar size={18} color="#0066CC" />
              <Text className="font-[Inter_600SemiBold] text-text-primary dark:text-surface ml-2">Check-in Slot</Text>
            </View>
            <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface">
              {time || "10:00 AM"}
            </Text>
          </View>
        </View>

        {/* Guests Card matching native theme */}
        <View className="bg-surface dark:bg-surface rounded-3xl p-5 mb-6 border border-border dark:border-border shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Users size={18} color="#0066CC" style={{ marginRight: 8 }} />
              <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface text-base">Guests</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push(`/checkout/guests?farmhouseId=${id}&start=${start}&end=${end}&type=${type}&time=${time}&adults=${guestCount}&children=0`)}
              className="py-1 px-3.5 bg-[#0066CC]/10 rounded-full border border-[#0066CC]/30"
            >
              <Text className="text-xs font-[Inter_700Bold] text-[#0066CC]">Edit</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity 
                className="w-12 h-12 rounded-full bg-[#0066CC] items-center justify-center shadow-md mr-3"
                onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
              >
                <Minus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface px-2">{guestCount}</Text>
              <TouchableOpacity 
                className="w-12 h-12 rounded-full bg-[#0066CC] items-center justify-center shadow-md ml-3"
                onPress={() => setGuestCount(guestCount + 1)}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <View className="items-end flex-1 ml-4">
              <Text className="text-xs font-[Inter_500Medium] text-text-muted text-right">
                Base capacity: {farmhouse?.includedGuests || farmhouse?.capacity || 30}
              </Text>
              {farmhouse?.extraGuestFee ? (
                <Text className="text-[11px] font-[Inter_600SemiBold] text-[#0066CC] text-right mt-0.5">
                  ₹{farmhouse.extraGuestFee}/extra
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <Text className="text-lg font-[Inter_600SemiBold] text-text-primary dark:text-surface mb-3">Contact Details</Text>
        
        <View className="space-y-3 mb-4">
          <StayGridTextField
            label="Email Address"
            placeholder="guest@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <StayGridTextField
            label="Phone Number"
            placeholder="9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            prefix={
              <Text className="text-base text-text-primary dark:text-surface font-[Inter_500Medium] mr-1">
                +91
              </Text>
            }
          />
        </View>

        <Text className="text-lg font-[Inter_600SemiBold] text-text-primary dark:text-surface mb-4">Price Details</Text>
        
        <View className="flex-row justify-between mb-3">
          <Text className="text-text-muted font-[Inter_400Regular]">₹{subtotalAmount.toLocaleString('en-IN')} X 1 Booking</Text>
          <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">₹{subtotalAmount.toLocaleString('en-IN')}</Text>
        </View>
        {parsedExtraFee > 0 && (
          <View className="flex-row justify-between mb-3">
            <Text className="text-text-muted font-[Inter_400Regular]">Extra Guest Fee</Text>
            <Text className="text-[#0066CC] font-[Inter_700Bold]">+₹{parsedExtraFee.toLocaleString('en-IN')}</Text>
          </View>
        )}
        
        <View className="h-px w-full bg-border dark:bg-border my-3" />
        
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-base">Total Amount</Text>
          <Text className="text-text-primary dark:text-surface font-[Inter_800ExtraBold] text-lg">₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>

        <View className="bg-surface dark:bg-border/40 p-4 rounded-2xl mb-6 border border-border dark:border-border">
          <View className="flex-row justify-between items-center pb-2 border-b border-border/60">
            <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-sm">Token Amount (Pay Now)</Text>
            <Text className="text-[#0066CC] font-[Inter_800ExtraBold] text-base">₹{tokenAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View className="flex-row justify-between items-center pt-2">
            <Text className="text-text-muted font-[Inter_600SemiBold] text-xs">Remaining Due (Pay at Check-in)</Text>
            <Text className="text-[#10B981] font-[Inter_800ExtraBold] text-base">₹{remainingDue.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <View className="mb-28">
          <StayGridTextArea
            label="Additional Note for Host / Admin"
            placeholder="Add any special request or note for the host or super admin (optional)..."
            value={notes}
            onChangeText={setNotes}
            minHeight={84}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar (with Safe Area Inset padding) */}
      <View 
        className="absolute bottom-0 w-full bg-surface/95 dark:bg-surface/95 pt-3 px-4 border-t border-border dark:border-border flex-row gap-3 shadow-2xl"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 28) }}
      >
        <TouchableOpacity 
          className="flex-1 py-4 rounded-2xl items-center border border-border dark:border-border bg-surface dark:bg-border"
          onPress={handleSaveForLater}
          disabled={bookingLoading}
        >
          <Text className="text-text-primary dark:text-surface font-[Inter_700Bold] text-sm">Save for Later</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-1 bg-[#10B981] py-4 rounded-2xl items-center shadow-md"
          onPress={handlePay}
          disabled={bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-[Inter_700Bold] text-sm">Pay Token (₹{tokenAmount})</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
