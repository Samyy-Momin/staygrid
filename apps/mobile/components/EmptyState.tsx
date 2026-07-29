import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SearchX, Inbox, HeartOff } from "lucide-react-native";
import { useThemeColors } from "../lib/theme-colors";

interface EmptyStateProps {
  type?: "search" | "favorites" | "bookings" | "generic";
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  type = "generic",
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  const colors = useThemeColors();
  let IconComponent = Inbox;
  let defaultTitle = "Nothing here yet";
  let defaultDesc = "We couldn't find any items matching your criteria.";

  if (type === "search") {
    IconComponent = SearchX;
    defaultTitle = "No Farmhouses Found";
    defaultDesc = "Try searching with a different city, title, or category.";
  } else if (type === "favorites") {
    IconComponent = HeartOff;
    defaultTitle = "No Favorites Saved";
    defaultDesc = "Tap the heart icon on any farmhouse to save it to your wishlist.";
  } else if (type === "bookings") {
    IconComponent = Inbox;
    defaultTitle = "No Bookings Yet";
    defaultDesc = "Your upcoming and past farmhouse bookings will appear here.";
  }

  return (
    <View className="py-12 px-6 items-center justify-center bg-surface dark:bg-surface rounded-3xl border border-border dark:border-border my-4 shadow-sm">
      <View className="w-16 h-16 bg-surface dark:bg-border rounded-full items-center justify-center mb-4">
        <IconComponent size={32} color={colors.accentPrimary} />
      </View>
      <Text className="text-xl font-[Inter_700Bold] text-text-primary dark:text-surface text-center mb-2">
        {title || defaultTitle}
      </Text>
      <Text className="text-sm font-[Inter_400Regular] text-text-muted dark:text-text-muted text-center px-4 mb-6 leading-relaxed">
        {description || defaultDesc}
      </Text>
      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-accent-primary px-6 py-3 rounded-full shadow-sm"
        >
          <Text className="text-white font-[Inter_600SemiBold] text-sm">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
