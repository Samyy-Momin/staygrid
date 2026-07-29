import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Star } from "lucide-react-native";
import { getApiUrl } from "../../lib/config";

const API_URL = getApiUrl();

export default function AllReviewsScreen() {
 const { farmhouseId } = useLocalSearchParams();
 const router = useRouter();
 
 const [reviews, setReviews] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchReviews = async () => {
 try {
 // Normally we might hit a dedicated reviews endpoint like /api/farmhouses/${farmhouseId}/reviews
 // For now, if the farmhouse endpoint returns reviews, we fetch it here.
 const res = await fetch(`${API_URL}/api/farmhouses/${farmhouseId}`);
 if (!res.ok) throw new Error("Failed to fetch");
 const data = await res.json();
 setReviews(data.reviews || []);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };
 if (farmhouseId) fetchReviews();
 }, [farmhouseId]);

 if (loading) {
 return (
 <SafeAreaView className="flex-1 bg-surface dark:bg-surface items-center justify-center">
 <ActivityIndicator size="large" color="#0066CC" />
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
 <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
 <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
 <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
 </TouchableOpacity>
 <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">All Reviews</Text>
 </View>

 {reviews.length === 0 ? (
 <View className="flex-1 items-center justify-center p-6">
 <Text className="text-text-muted font-[Inter_500Medium]">No reviews yet.</Text>
 </View>
 ) : (
 <ScrollView className="flex-1 px-6 pt-4">
 {reviews.map((review, index) => (
 <View key={index} className="bg-surface dark:bg-surface p-5 rounded-3xl border border-border dark:border-border shadow-sm mb-4">
 <View className="flex-row justify-between items-start mb-3">
 <View className="flex-row items-center">
 <View className="w-10 h-10 rounded-full bg-surface dark:bg-surface items-center justify-center mr-3">
 <Text className="text-accent-primary dark:text-text-muted font-[Inter_700Bold]">
 {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
 </Text>
 </View>
 <View>
 <Text className="font-[Inter_700Bold] text-text-primary dark:text-surface">
 {review.user?.name || 'Guest User'}
 </Text>
 <Text className="text-xs text-text-muted">
 {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
 </Text>
 </View>
 </View>
 <View className="flex-row bg-surface dark:bg-surface px-2 py-1 rounded-full items-center">
 <Star size={10} color="#F59E0B" fill="#F59E0B" />
 <Text className="text-warning dark:text-text-muted text-[10px] font-[Inter_700Bold] ml-1">{review.rating}</Text>
 </View>
 </View>
 <Text className="text-text-muted dark:text-text-muted text-sm leading-relaxed">
 {review.comment}
 </Text>
 </View>
 ))}
 </ScrollView>
 )}
 </SafeAreaView>
 );
}
