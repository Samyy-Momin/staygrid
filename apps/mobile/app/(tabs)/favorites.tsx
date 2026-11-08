import { View, Text, TouchableOpacity, Image, ScrollView, LayoutAnimation, Platform, UIManager, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Star, MapPin } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFavoriteStore } from "../../lib/store";
import { useState, useEffect } from "react";
import { getApiUrl, getFullImageUrl } from "../../lib/config";
import { useThemeColors } from "../../lib/theme-colors";

const API_URL = getApiUrl();

export default function FavoritesTabScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { favorites, toggleFavorite, isFavorite } = useFavoriteStore();
  const [farmhouses, setFarmhouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/farmhouses?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setFarmhouses(list);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const favoriteFarmhouses = farmhouses.filter((f) => isFavorite(f.id));

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface" edges={["top"]}>
      <View className="px-6 py-4 border-b border-border dark:border-border">
        <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface">My Wishlist</Text>
        <Text className="text-xs text-text-muted font-[Inter_500Medium] mt-0.5">Your saved properties for easy booking</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : favoriteFarmhouses.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-24 h-24 bg-surface dark:bg-surface rounded-full items-center justify-center mb-4 border border-border">
            <Heart size={40} color="#f43f5e" fill="#f43f5e" />
          </View>
          <Text className="text-xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-2 text-center">
            Your Wishlist is Empty
          </Text>
          <Text className="text-xs text-text-muted font-[Inter_500Medium] text-center mb-6 px-6 leading-relaxed">
            Tap the heart icon on any farmhouse card to save your favorite getaways here.
          </Text>
          <TouchableOpacity 
            className="bg-[#0066CC] px-8 py-3.5 rounded-full shadow-md"
            onPress={() => router.push("/farmhouse/all")}
          >
            <Text className="text-white font-[Inter_700Bold] text-sm">Explore Farmhouses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {favoriteFarmhouses.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/farmhouse/${item.id}`)}
              className="mb-5 bg-surface dark:bg-surface rounded-[28px] overflow-hidden border border-border shadow-sm"
            >
              <View className="h-48 w-full relative">
                <Image
                  source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => toggleFavorite(item.id)}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full items-center justify-center border border-white/20"
                >
                  <Heart size={16} color="#f43f5e" fill="#f43f5e" />
                </TouchableOpacity>
                <View className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full flex-row items-center border border-white/20">
                  <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                  <Text className="text-white font-[Inter_700Bold] text-[11px]">{item.avgRating || "5.0"}</Text>
                </View>
              </View>
              <View className="p-4">
                <Text className="text-base font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-1">{item.title}</Text>
                <View className="flex-row items-center mb-2.5">
                  <MapPin size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                  <Text className="text-xs font-[Inter_500Medium] text-text-muted">{item.city || "Bhiwandi"}, Maharashtra</Text>
                </View>
                <View className="flex-row items-center justify-between border-t border-border pt-2.5">
                  <Text className="text-xs font-[Inter_600SemiBold] text-text-muted">12H Stay Price</Text>
                  <Text className="text-base font-[Inter_800ExtraBold] text-[#0066CC]">₹{item.price12Hours?.toLocaleString('en-IN') || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
