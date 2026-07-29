import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

export default function AppEntry() {
 const router = useRouter();
 const [appState, setAppState] = useState<"SPLASH" | "ONBOARDING" | "AUTH">("SPLASH");

 useEffect(() => {
 // Simulate splash screen delay and check onboarding status
 const initializeApp = async () => {
 try {
 const hasSeenOnboarding = await AsyncStorage.getItem("has_seen_onboarding");
 
 setTimeout(() => {
 if (hasSeenOnboarding === "true") {
 setAppState("AUTH");
 } else {
 setAppState("ONBOARDING");
 }
 }, 2000); // 2 seconds splash screen
 } catch (e) {
 setAppState("ONBOARDING");
 }
 };

 initializeApp();
 }, []);

 const finishOnboarding = async () => {
 try {
 await AsyncStorage.setItem("has_seen_onboarding", "true");
 setAppState("AUTH");
 } catch (e) {
 console.error("Failed to save onboarding state", e);
 }
 };

 if (appState === "SPLASH") {
 return (
 <SafeAreaView className="flex-1 bg-black justify-center items-center">
 <StatusBar style="light" />
 <View className="w-40 h-40 rounded-full overflow-hidden mb-6 bg-surface items-center justify-center">
 <Image 
 source={require('../assets/staygrid-logo.png')} 
 style={{ width: '100%', height: '100%' }} 
 resizeMode="cover" 
 />
 </View>
 <Text className="text-white text-lg font-[Inter_500Medium] text-center tracking-widest uppercase">
 bhiwandi farmhouse
 </Text>
 <Text className="text-white text-lg font-[Inter_500Medium] text-center tracking-widest uppercase">
 discovery app
 </Text>
 </SafeAreaView>
 );
 }

 if (appState === "ONBOARDING") {
 return (
 <SafeAreaView className="flex-1 bg-surface dark:bg-surface justify-between items-center p-6">
 <View className="flex-1 justify-center items-center w-full mt-10">
 <View className="w-[300px] h-[300px] rounded-full overflow-hidden mb-12 shadow-xl border-4 border-white dark:border-border">
 <Image 
 source={require('../assets/villa-bali-resort-7619823.webp')} 
 style={{ width: '100%', height: '100%' }} 
 resizeMode="cover" 
 />
 </View>
 <Text className="text-3xl text-text-primary dark:text-surface font-[Inter_700Bold] text-center mb-4 px-4 leading-tight">
 Find your best farmhouse to stay
 </Text>
 <Text className="text-base text-text-muted dark:text-text-muted text-center px-6 font-[Inter_400Regular] leading-relaxed">
 Discover and book the most beautiful and luxurious farmhouses for your next getaway.
 </Text>
 </View>

 <View className="w-full pb-8">
 <TouchableOpacity 
 onPress={finishOnboarding}
 className="w-full bg-accent-primary rounded-full py-4 items-center shadow-md"
 >
 <Text className="text-white text-lg font-[Inter_600SemiBold]">Get Started</Text>
 </TouchableOpacity>
 </View>
 </SafeAreaView>
 );
 }

 // AUTH State
 return (
 <SafeAreaView className="flex-1 bg-surface dark:bg-surface p-6 justify-between items-center">
 <View className="flex-1 justify-center items-center">
 <View className="w-32 h-32 rounded-full mb-6 shadow-sm overflow-hidden bg-black items-center justify-center">
 <Image source={require('../assets/staygrid-logo.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
 </View>
 <Text className="text-3xl text-text-primary dark:text-surface font-[Inter_700Bold] text-center mb-3">
 StayGrid
 </Text>
 <Text className="text-base text-text-muted dark:text-text-muted text-center px-4 font-[Inter_400Regular]">
 Book beautiful farmhouses instantly. The perfect getaway awaits you.
 </Text>
 </View>

 <View className="w-full pb-8">
 <TouchableOpacity 
  className="w-full bg-accent-primary rounded-xl py-4 items-center mb-4 shadow-sm"
  onPress={() => router.push("/auth/signup")}
  >
  <Text className="text-white text-lg font-[Inter_600SemiBold]">New user? Please Sign Up</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
  className="w-full bg-surface dark:bg-surface rounded-xl py-4 items-center border border-border dark:border-border"
  onPress={() => router.push("/auth/login")}
  >
  <Text className="text-text-primary dark:text-surface text-lg font-[Inter_600SemiBold]">Already a user? Please Login</Text>
  </TouchableOpacity>
 </View>
 </SafeAreaView>
 );
}
