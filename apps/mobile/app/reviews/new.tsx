import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, Star, Users, Droplet, Sparkles, ShieldCheck, HeartHandshake, CheckCircle2 } from "lucide-react-native";
import { api, authApi } from "../../lib/authApi";
import { useThemeColors } from "../../lib/theme-colors";
import { StayGridTextArea } from "../../components/ui/StayGridTextField";

const GROUP_TYPES = ["Family", "Couple", "Friends Group"];

const DEFAULT_AMENITIES = [
  { key: "pool", label: "Pool & Outdoor Area", icon: Droplet },
  { key: "cleanliness", label: "Cleanliness & Hygiene", icon: ShieldCheck },
  { key: "games", label: "Turf & Indoor Games", icon: Sparkles },
  { key: "hospitality", label: "Staff & Hospitality", icon: HeartHandshake },
];

export default function NewReviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const [rating, setRating] = useState(5);
  const [groupType, setGroupType] = useState("Family");
  const [amenityRatings, setAmenityRatings] = useState<Record<string, number>>({
    pool: 5,
    cleanliness: 5,
    games: 5,
    hospitality: 5,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleCancel = () => {
    const rawBookingId = params.bookingId;
    const targetBookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : (typeof rawBookingId === 'string' ? rawBookingId : '');
    if (targetBookingId) {
      router.replace(`/bookings/${targetBookingId}`);
    } else {
      router.replace("/(tabs)/bookings");
    }
  };

  const handleAmenityRate = (key: string, score: number) => {
    setAmenityRatings((prev) => ({ ...prev, [key]: score }));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating before submitting.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Review Required", "Please write a few words about your stay experience.");
      return;
    }

    setSubmitting(true);
    try {
      const rawId = params.farmhouseId || params.id;
      let targetFarmhouseId = Array.isArray(rawId) ? rawId[0] : (typeof rawId === 'string' ? rawId : '');

      if (!targetFarmhouseId) {
        const bookingsRes = await api.get("/api/bookings/me").catch(() => null);
        const myBookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
        if (myBookings.length > 0) {
          targetFarmhouseId = typeof myBookings[0].farmhouseId === 'string' ? myBookings[0].farmhouseId : myBookings[0].farmhouseId?.[0];
        }
      }

      if (!targetFarmhouseId) {
        Alert.alert("Missing Property", "Could not identify the farmhouse to review.");
        setSubmitting(false);
        return;
      }

      console.log("[REVIEW_SUBMIT] Submitting review for farmhouseId:", targetFarmhouseId);

      await api.post("/api/reviews", {
        farmhouseId: String(targetFarmhouseId),
        rating: Number(rating),
        comment: comment.trim(),
        groupType,
        amenityRatings,
      });

      setSubmittedSuccess(true);

      setTimeout(() => {
        const rawBookingId = params.bookingId;
        const targetBookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : (typeof rawBookingId === 'string' ? rawBookingId : '');
        if (targetBookingId) {
          router.replace(`/bookings/${targetBookingId}`);
        } else {
          router.replace("/(tabs)/bookings");
        }
      }, 1500);

    } catch (err: any) {
      console.error(err);
      Alert.alert("Submission Failed", err.response?.data?.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center p-6">
        <View className="w-24 h-24 bg-success/15 rounded-full items-center justify-center mb-4 border border-success/30">
          <CheckCircle2 size={56} color="#10B981" />
        </View>
        <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-2 text-center">
          🎉 Congratulations!
        </Text>
        <Text className="text-base font-[Inter_700Bold] text-success mb-2 text-center">
          Booking Confirmed — Enjoy Your Stay!
        </Text>
        <Text className="text-xs text-text-muted font-[Inter_500Medium] text-center max-w-[280px]">
          Thank you for writing a review. Opening your booking ticket details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Write a Detailed Review</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-5" showsVerticalScrollIndicator={false}>
          {/* Overall Rating Header */}
          <View className="items-center mb-6 bg-surface dark:bg-surface p-6 rounded-3xl border border-border shadow-sm">
            <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface mb-3">Overall Stay Rating</Text>
            <View className="flex-row gap-3 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                  <Star size={36} color={star <= rating ? "#F59E0B" : "#CFCFC8"} fill={star <= rating ? "#F59E0B" : "transparent"} />
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-xs font-[Inter_600SemiBold] text-[#0066CC]">
              {rating === 5 ? "5 Stars - Outstanding Experience!" : `${rating} Stars Stay`}
            </Text>
          </View>

          {/* Group Type Selector (3 options only: Family, Couple, Friends Group) */}
          <View className="mb-6">
            <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-2.5">Who did you travel with?</Text>
            <View className="flex-row flex-wrap gap-2.5">
              {GROUP_TYPES.map((type) => {
                const isSelected = groupType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setGroupType(type)}
                    className={`px-5 py-3 rounded-full border ${
                      isSelected ? "bg-[#0066CC] border-[#0066CC]" : "bg-surface dark:bg-surface border-border"
                    }`}
                  >
                    <Text className={`text-xs font-[Inter_700Bold] ${isSelected ? "text-white" : "text-text-primary dark:text-surface"}`}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Amenity Rating Breakdown */}
          <View className="mb-6 bg-surface dark:bg-surface p-5 rounded-3xl border border-border shadow-sm space-y-4">
            <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-1">Rate Specific Features</Text>

            {DEFAULT_AMENITIES.map((item) => {
              const currentScore = amenityRatings[item.key] || 5;
              const IconComp = item.icon;
              return (
                <View key={item.key} className="flex-row items-center justify-between py-2 border-b border-border/40 last:border-b-0">
                  <View className="flex-row items-center">
                    <IconComp size={16} color="#0066CC" style={{ marginRight: 8 }} />
                    <Text className="text-xs font-[Inter_600SemiBold] text-text-primary dark:text-surface">{item.label}</Text>
                  </View>
                  <View className="flex-row gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => handleAmenityRate(item.key, s)}>
                        <Star size={18} color={s <= currentScore ? "#F59E0B" : "#D1D5DB"} fill={s <= currentScore ? "#F59E0B" : "transparent"} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Comment Section */}
          <StayGridTextArea
            label="Your Written Review"
            placeholder="Share details of your experience, pool cleanliness, games, host behavior..."
            value={comment}
            onChangeText={setComment}
            minHeight={110}
            containerClassName="mb-8"
          />

          {/* 2 Side-by-Side Action Buttons: Submit Review & Cancel Review */}
          <View className="mb-12 flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 bg-[#10B981] py-4 rounded-2xl items-center shadow-md justify-center"
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-[Inter_700Bold] text-base">Submit Review</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-surface dark:bg-surface border-2 border-danger dark:border-danger py-4 rounded-2xl items-center justify-center"
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text className="text-danger font-[Inter_700Bold] text-base">Cancel Review</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
