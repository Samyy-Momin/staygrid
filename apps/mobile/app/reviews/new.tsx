import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, Star } from "lucide-react-native";
import { api, authApi } from "../../lib/authApi";
import { useThemeColors } from "../../lib/theme-colors";

export default function NewReviewScreen() {
  const { farmhouseId } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const session = await authApi.getSession();
      if (!session) {
        Alert.alert("Login Required", "Please log in to submit a review.");
        setSubmitting(false);
        return;
      }

      await api.post("/api/reviews", {
        farmhouseId,
        rating,
        comment: comment.trim(),
      });

      Alert.alert("Thank You!", "Your review has been submitted successfully!", [
        { text: "Return Home", onPress: () => router.replace("/(tabs)/home") }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Submission Failed", err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5: return "5 Stars - Outstanding Experience!";
      case 4: return "4 Stars - Great Stay";
      case 3: return "3 Stars - Average Stay";
      case 2: return "2 Stars - Could be Better";
      case 1: return "1 Star - Poor Experience";
      default: return "Tap a star to rate";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Write a Review</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Rating Section */}
          <View className="items-center mb-6 bg-surface dark:bg-surface p-6 rounded-3xl border border-border dark:border-border shadow-sm">
            <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface mb-3">How was your stay?</Text>
            <View className="flex-row gap-3 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                  <Star 
                    size={36} 
                    color={star <= rating ? "#F59E0B" : "#CFCFC8"} 
                    fill={star <= rating ? "#F59E0B" : "transparent"} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-xs font-[Inter_600SemiBold] text-[#0066CC]">{getRatingLabel(rating)}</Text>
          </View>

          {/* Comment Section */}
          <Text className="text-sm font-[Inter_700Bold] text-text-primary dark:text-surface mb-2">Your Feedback</Text>
          <View className="bg-surface dark:bg-surface rounded-2xl border border-border dark:border-border p-4 mb-8">
            <TextInput
              className="text-base text-text-primary dark:text-surface font-[Inter_400Regular] min-h-[110px]"
              placeholder="Share details of your experience, cleanliness, amenities, or host response..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            className="bg-[#10B981] py-4 rounded-2xl items-center shadow-md mb-12"
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-[Inter_700Bold] text-base">Submit Review</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
