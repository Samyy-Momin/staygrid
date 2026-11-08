import { View, Text, FlatList, TouchableOpacity, Image, Modal, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, Play, Eye, Sparkles, X, Heart, Home, RefreshCw } from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { api } from "../lib/authApi";
import { useThemeColors } from "../lib/theme-colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2;

function ReelVideoPlayer({ url }: { url: string }) {
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

export default function ExploreScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchExploreFeed();
  }, []);

  const fetchExploreFeed = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/explore");
      setMediaList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch explore feed error:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentMedia = selectedMediaIndex !== null ? mediaList[selectedMediaIndex] : null;

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center border-b border-border/80">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface dark:bg-border items-center justify-center border border-border">
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-black text-text dark:text-text-dark flex-row items-center">
              🎬 Explore Reels & Stays
            </Text>
            <Text className="text-xs text-text-muted font-medium">Watch 9:16 video tours of staygrid farmhouses</Text>
          </View>
        </View>

        <TouchableOpacity onPress={fetchExploreFeed} className="p-2.5 rounded-xl bg-surface border border-border">
          <RefreshCw size={16} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {/* 2x2 Staggered Grid Feed */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-xs font-bold text-text-muted">Loading explore reels...</Text>
        </View>
      ) : mediaList.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8 text-center">
          <Sparkles size={40} color="#FF2D55" />
          <Text className="text-base font-black text-text dark:text-text-dark mt-3">No Reels Posted Yet</Text>
          <Text className="text-xs text-text-muted text-center font-medium mt-1 max-w-xs">
            Follow @staygridmumbai on Instagram for live video tours of luxury farmhouses!
          </Text>
        </View>
      ) : (
        <FlatList
          data={mediaList}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 14 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          renderItem={({ item, index }) => {
            const isReel = item.type === "REEL";
            const cardHeight = isReel ? 260 : 180;

            return (
              <TouchableOpacity
                onPress={() => setSelectedMediaIndex(index)}
                activeOpacity={0.9}
                style={{ width: CARD_WIDTH, height: cardHeight }}
                className="bg-black rounded-3xl overflow-hidden shadow-md border border-border/40 relative"
              >
                <Image
                  source={{ uri: item.thumbnailUrl || item.mediaUrl }}
                  className="w-full h-full object-cover"
                  resizeMode="cover"
                />

                {isReel && (
                  <View className="absolute top-3 left-3 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/20">
                    <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}

                <View className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex-row items-center gap-1 border border-white/20">
                  <Eye size={10} color="#FFFFFF" />
                  <Text className="text-[10px] font-bold text-white">{(item.viewCount || 1200).toLocaleString()}</Text>
                </View>

                {/* Bottom Overlay */}
                <View className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-1">
                  <Text className="text-xs font-black text-white" numberOfLines={2}>
                    {item.caption || item.farmhouse?.title || "StayGrid Video Tour"}
                  </Text>
                  {item.farmhouse && (
                    <Text className="text-[10px] font-bold text-sky-300" numberOfLines={1}>
                      🏡 {item.farmhouse.title}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FULL SCREEN REEL & PHOTO PLAYER MODAL */}
      {currentMedia && (
        <Modal visible={selectedMediaIndex !== null} transparent animationType="slide" onRequestClose={() => setSelectedMediaIndex(null)}>
          <View className="flex-1 bg-black relative">
            {currentMedia.type === "REEL" ? (
              <ReelVideoPlayer url={currentMedia.mediaUrl} />
            ) : (
              <Image
                source={{ uri: currentMedia.mediaUrl }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                resizeMode="contain"
              />
            )}

            {/* Top Close Bar */}
            <SafeAreaView className="absolute top-4 inset-x-4 flex-row justify-between items-center z-20">
              <View className="flex-row items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <Sparkles size={14} color="#FF2D55" />
                <Text className="text-xs font-black text-white">StayGrid Explore</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMediaIndex(null)} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Bottom Floating Booking Bar */}
            <View className="absolute bottom-10 inset-x-5 space-y-3 z-20">
              <Text className="text-sm font-bold text-white drop-shadow-md">
                {currentMedia.caption || "Experience luxury stays with StayGrid"}
              </Text>

              {currentMedia.farmhouse && (
                <TouchableOpacity
                  onPress={() => {
                    const id = currentMedia.farmhouse.id;
                    setSelectedMediaIndex(null);
                    router.push(`/farmhouse/${id}`);
                  }}
                  activeOpacity={0.9}
                  className="w-full py-3.5 bg-accent-blue rounded-2xl flex-row items-center justify-center gap-2 shadow-2xl border border-white/30"
                >
                  <Home size={18} color="#FFFFFF" />
                  <Text className="text-sm font-black text-white">
                    Book {currentMedia.farmhouse.title} @ ₹{currentMedia.farmhouse.price24Hours?.toLocaleString("en-IN") || "8,000"}/24h →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
