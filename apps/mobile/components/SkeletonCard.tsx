import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View className="mb-5 bg-surface dark:bg-surface rounded-2xl overflow-hidden border border-border dark:border-border p-4 shadow-sm">
      <Animated.View style={{ opacity }} className="h-44 w-full bg-border dark:bg-border rounded-xl mb-4" />
      <Animated.View style={{ opacity }} className="h-5 w-3/4 bg-border dark:bg-border rounded-md mb-2" />
      <Animated.View style={{ opacity }} className="h-4 w-1/2 bg-border dark:bg-border rounded-md mb-4" />
      <View className="flex-row justify-between items-center pt-3 border-t border-border dark:border-border">
        <Animated.View style={{ opacity }} className="h-5 w-24 bg-border dark:bg-border rounded-md" />
        <Animated.View style={{ opacity }} className="h-5 w-20 bg-border dark:bg-border rounded-md" />
      </View>
    </View>
  );
}
