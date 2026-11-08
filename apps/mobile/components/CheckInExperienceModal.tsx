import { View, Text, Modal, TouchableOpacity, Image } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Star, X, Sparkles, Heart } from "lucide-react-native";
import { api } from "../lib/authApi";
import { getFullImageUrl } from "../lib/config";
import { StayGridTextArea } from "./ui/StayGridTextField";

export function CheckInExperienceModal() {
  const router = useRouter();
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkTodayBooking();
  }, []);

  const checkTodayBooking = async () => {
    try {
      const res = await api.get("/api/bookings/me");
      if (!Array.isArray(res.data) || res.data.length === 0) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find booking where today >= checkIn date AND status is CONFIRMED / COMPLETED
      const matching = res.data.find((b: any) => {
        if (!b || b.status === "CANCELLED" || b.status === "SAVED") return false;
        const checkIn = new Date(b.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return today >= checkIn;
      });

      if (matching) {
        setActiveBooking(matching);
        // Show modal once per session
        setVisible(true);
      }
    } catch (err) {
      // Ignore auth/network check errors quietly
    }
  };

  const handleSubmitReview = async () => {
    if (!activeBooking) return;
    setSubmitting(true);
    try {
      await api.post("/api/reviews", {
        farmhouseId: activeBooking.farmhouseId,
        rating,
        comment: comment.trim() || "Great stay experience!",
      });
      setSubmitted(true);
      setTimeout(() => {
        setVisible(false);
        router.push(`/bookings/${activeBooking.id}`);
      }, 1500);
    } catch (err) {
      console.error("Submit review error:", err);
      setVisible(false);
      router.push(`/bookings/${activeBooking.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || !activeBooking) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View className="flex-1 bg-black/70 justify-center items-center p-5">
        <View className="w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl p-6 shadow-2xl space-y-4">
          <View className="flex-row justify-between items-center border-b border-border pb-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#0066CC" />
              <Text className="text-sm font-black text-text dark:text-text-dark">Today's Stay Check-in!</Text>
            </View>
            <TouchableOpacity onPress={() => setVisible(false)} className="p-1 rounded-full bg-surface dark:bg-border">
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View className="items-center py-6 space-y-2">
              <Heart size={40} color="#10B981" />
              <Text className="text-base font-black text-emerald-600 text-center">Thank You for Your Feedback! 🎉</Text>
              <Text className="text-xs text-text-muted text-center font-medium">Redirecting to your booking ticket...</Text>
            </View>
          ) : (
            <View className="space-y-4">
              <Text className="text-sm font-bold text-text dark:text-text-dark leading-tight">
                🎉 You have a booking today at{" "}
                <Text className="text-accent-blue font-black">{activeBooking.farmhouse?.title || "your farmhouse"}</Text>! How is your stay experience so far?
              </Text>

              {/* Star Rating selector */}
              <View className="flex-row justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
                    <Star size={32} color={star <= rating ? "#F59E0B" : "#D1D5DB"} fill={star <= rating ? "#F59E0B" : "transparent"} />
                  </TouchableOpacity>
                ))}
              </View>

              <StayGridTextArea
                placeholder="Share your thoughts (optional)..."
                value={comment}
                onChangeText={setComment}
                numberOfLines={3}
                minHeight={80}
              />

              <View className="flex-row gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => {
                    setVisible(false);
                    router.push(`/bookings/${activeBooking.id}`);
                  }}
                  className="flex-1 py-3 bg-surface dark:bg-border rounded-xl items-center border border-border"
                >
                  <Text className="text-xs font-bold text-text-muted">View Ticket</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmitReview}
                  disabled={submitting}
                  className="flex-1 py-3 bg-accent-blue rounded-xl items-center shadow-md"
                >
                  <Text className="text-xs font-black text-white">{submitting ? "Submitting..." : "Submit Experience"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
