import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

/** Big, obvious back button + title for owner screens. */
export function OwnerHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center px-2 py-2">
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/owner"))}
        className="w-12 h-12 rounded-full items-center justify-center active:bg-black/5"
        accessibilityLabel="Back"
      >
        <ChevronLeft size={30} color="#1E293B" />
      </Pressable>
      <Text className="text-text-primary text-2xl font-[Inter_800ExtraBold] ml-1">{title}</Text>
    </View>
  );
}
