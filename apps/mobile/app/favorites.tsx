import { View, Text, TouchableOpacity, Image, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFavoriteStore } from "../lib/store";
import { useState, useEffect } from "react";
import { getApiUrl, getFullImageUrl } from "../lib/config";

const API_URL = getApiUrl();

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
 UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FavoritesScreen() {
 const router = useRouter();
 const { favorites, toggleFavorite, isFavorite } = useFavoriteStore();
 const [farmhouses, setFarmhouses] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch(`${API_URL}/api/farmhouses?limit=100`)
 .then(res => res.json())
 .then(data => {
 setFarmhouses(data.data || []);
 })
 .catch(err => console.error(err))
 .finally(() => setLoading(false));
 }, []);

 const favoriteFarmhouses = farmhouses.filter(f => isFavorite(f.id));

 return (
 <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
 <View className="px-6 py-4 flex-row items-center border-b border-border dark:border-border">
 <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface">
 <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
 </TouchableOpacity>
 <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface">Favorites</Text>
 </View>

 {loading ? (
 <View className="flex-1 items-center justify-center p-6">
 <Text className="text-text-muted font-[Inter_500Medium]">Loading favorites...</Text>
 </View>
 ) : favoriteFarmhouses.length === 0 ? (
 <View className="flex-1 items-center justify-center p-6">
 <View className="w-24 h-24 bg-surface dark:bg-surface rounded-full items-center justify-center mb-6">
 <Heart size={40} color="#f43f5e" />
 </View>
 <Text className="text-2xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-2 text-center">
 No favorites yet
 </Text>
 <Text className="text-text-muted font-[Inter_400Regular] text-center mb-8 px-4">
 No farmhouse added in the favorites, explore all to find your perfect stay.
 </Text>
 <TouchableOpacity 
 className="bg-accent-primary px-8 py-4.5 rounded-full shadow-md "
 onPress={() => router.push('/farmhouse/all')}
 >
 <Text className="text-white font-[Inter_700Bold] text-base">Explore All</Text>
 </TouchableOpacity>
 </View>
 ) : (
 <ScrollView className="flex-1 px-6 pt-4">
 {favoriteFarmhouses.map(item => (
 <TouchableOpacity 
 key={item.id}
 onPress={() => router.push(`/farmhouse/${item.id}`)}
 className="mb-4 bg-surface dark:bg-surface rounded-2xl overflow-hidden border border-border dark:border-border"
 >
 <View className="h-48 w-full relative">
 <Image source={{ uri: getFullImageUrl(item.photos?.[0] || item.images?.[0]) }} className="w-full h-full" resizeMode="cover" />
 <TouchableOpacity 
 onPress={() => {
 LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
 toggleFavorite(item.id);
 }}
 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
 className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-black/40 rounded-full items-center justify-center"
 >
 <Heart size={18} color="#f43f5e" fill="#f43f5e" />
 </TouchableOpacity>
 </View>
 <View className="p-4">
 <Text className="font-[Inter_700Bold] text-base text-text-primary dark:text-surface">{item.title}</Text>
 <Text className="text-sm text-text-muted dark:text-text-muted mt-1">{item.city || 'Unknown Location'}</Text>
 </View>
 </TouchableOpacity>
 ))}
 </ScrollView>
 )}
 </SafeAreaView>
 );
}
