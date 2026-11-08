import "../global.css";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet, useColorScheme } from "react-native";
import LottieView from "lottie-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { themes } from "../lib/theme";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
 const [loaded, error] = useFonts({
 Inter_400Regular,
 Inter_500Medium,
 Inter_600SemiBold,
 Inter_700Bold,
 Inter_800ExtraBold,
 });

 useEffect(() => {
   const openBooking = (response: Notifications.NotificationResponse | null) => {
     const data = response?.notification.request.content.data as { bookingId?: string } | undefined;
     if (data?.bookingId) router.push('/bookings/' + data.bookingId);
   };
   Notifications.getLastNotificationResponseAsync().then(openBooking).catch(() => {});
   const subscription = Notifications.addNotificationResponseReceivedListener(openBooking);
   return () => subscription.remove();
 }, []);

 const [animationFinished, setAnimationFinished] = useState(false);

 useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      import('../lib/notifications').then(m => m.registerForPushNotificationsAsync().catch(console.error));
    }
  }, [loaded, error]);

 const colorScheme = useColorScheme();

 if (!loaded && !error) {
 return null;
 }

 return (
 <SafeAreaProvider>
 <QueryClientProvider client={queryClient}>
 <View style={[styles.container, colorScheme === 'dark' ? themes.dark : themes.light]}>
 <StatusBar style="auto" />
 
 {!animationFinished ? (
 <View style={styles.splashContainer}>
 <LottieView
 autoPlay
 loop={false}
 style={{ width: 300, height: 300 }}
 source={require("../assets/splash.json")}
 onAnimationFinish={() => setAnimationFinished(true)}
 />
 </View>
 ) : (
 <Stack screenOptions={{ headerShown: false }}>
 <Stack.Screen name="index" />
 <Stack.Screen name="auth/login" />
 <Stack.Screen name="auth/signup" />
 <Stack.Screen name="(tabs)" />
 <Stack.Screen name="farmhouse/all" />
 <Stack.Screen name="farmhouse/[id]" />
 </Stack>
 )}
 </View>
 </QueryClientProvider>
 </SafeAreaProvider>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 },
 splashContainer: {
 flex: 1,
 backgroundColor: '#FBFBF9',
 justifyContent: 'center',
 alignItems: 'center',
 }
});
