import { View, Text, FlatList, TouchableOpacity, Image, Modal, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Play, Eye, Sparkles, X, Heart, Home } from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { api } from "../lib/authApi";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function CarouselVideoPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
      player={player}
      allowsFullscreen={false}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

export function ReelCarousel() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const res = await api.get("/api/explore?type=REEL");
      setReels(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch reels error:", err);
    }
  };

  if (reels.length === 0) return null;

  const currentReel = selectedReelIndex !== null ? reels[selectedReelIndex] : null;

  return (
    <View className="my-4 space-y-3">
      <View className="flex-row justify-between items-center px-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={18} color="#FF2D55" />
          <Text className="text-base font-black text-text dark:text-text-dark">Explore Stays & Reels</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/explore")} activeOpacity={0.7}>
          <Text className="text-xs font-bold text-accent-blue">See All →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reels}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => setSelectedReelIndex(index)}
            activeOpacity={0.9}
            className="w-36 h-60 bg-black rounded-3xl overflow-hidden shadow-lg border border-border/40 relative"
          >
            <Image
              source={{ uri: item.thumbnailUrl || item.mediaUrl }}
              className="w-full h-full object-cover opacity-90"
              resizeMode="cover"
            />
            
            {/* Play Badge */}
            <View className="absolute top-3 left-3 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/20">
              <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
            </View>

            {/* View Count */}
            <View className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex-row items-center gap-1 border border-white/20">
              <Eye size={10} color="#FFFFFF" />
              <Text className="text-[10px] font-bold text-white">{(item.viewCount || 1200).toLocaleString()}</Text>
            </View>

            {/* Bottom Gradient Overlay */}
            <View className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-1">
              <Text className="text-xs font-black text-white line-clamp-2" numberOfLines={2}>
                {item.caption || item.farmhouse?.title || "Luxury Stay Experience"}
              </Text>
              {item.farmhouse && (
                <View className="flex-row items-center gap-1">
                  <Home size={10} color="#38BDF8" />
                  <Text className="text-[10px] font-bold text-sky-300 truncate" numberOfLines={1}>
                    {item.farmhouse.title}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FULL SCREEN REEL PLAYER MODAL */}
      {currentReel && (
        <Modal visible={selectedReelIndex !== null} transparent animationType="slide" onRequestClose={() => setSelectedReelIndex(null)}>
          <View className="flex-1 bg-black relative">
            <CarouselVideoPlayer url={currentReel.mediaUrl} />

            {/* Top Close Bar */}
            <SafeAreaView className="absolute top-4 inset-x-4 flex-row justify-between items-center z-20">
              <View className="flex-row items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <Sparkles size={14} color="#FF2D55" />
                <Text className="text-xs font-black text-white">StayGrid Reels</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReelIndex(null)} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Bottom Floating Booking Bar */}
            <View className="absolute bottom-10 inset-x-5 space-y-3 z-20">
              <Text className="text-sm font-bold text-white drop-shadow-md">
                {currentReel.caption || "Experience luxury stays with StayGrid"}
              </Text>

              {currentReel.farmhouse && (
                <TouchableOpacity
                  onPress={() => {
                    const id = currentReel.farmhouse.id;
                    setSelectedReelIndex(null);
                    router.push(`/farmhouse/${id}`);
                  }}
                  activeOpacity={0.9}
                  className="w-full py-3.5 bg-accent-blue rounded-2xl flex-row items-center justify-center gap-2 shadow-2xl border border-white/30"
                >
                  <Home size={18} color="#FFFFFF" />
                  <Text className="text-sm font-black text-white">
                    Book {currentReel.farmhouse.title} @ ₹{currentReel.farmhouse.price24Hours?.toLocaleString("en-IN") || "8,000"}/24h →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
