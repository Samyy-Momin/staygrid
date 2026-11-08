import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { authApi } from "../../lib/authApi";
import { unregisterPushNotificationsAsync } from "../../lib/notifications";
import { LogOut, Settings, TrendingUp, ChevronRight } from "lucide-react-native";
import { useThemeColors } from "../../lib/theme-colors";
import { mixpanel } from "../../lib/mixpanel";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getSession().then((data) => {
      if (data?.user) {
        setSession(data);
        mixpanel.identify(data.user.id);
        mixpanel.setPeople({
          $name: data.user.name || "Customer",
          $email: data.user.email || undefined,
          $phone: data.user.phone || undefined,
          role: data.user.role || "CUSTOMER",
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface justify-center items-center p-6">
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </SafeAreaView>
    );
  }

  const user = session?.user;
  const isOwner = String(user?.role).toUpperCase() === "OWNER" || String(user?.role).toUpperCase() === "ADMIN";
  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "NA";

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface justify-center items-center p-6">
      <View className="w-24 h-24 bg-surface dark:bg-surface rounded-full items-center justify-center mb-4 border border-border">
        <Text className="text-3xl text-accent-primary dark:text-text-muted font-[Inter_700Bold]">{initials}</Text>
      </View>
      <Text className="text-2xl font-[Inter_700Bold] text-text-primary dark:text-surface">{user?.name || "Guest User"}</Text>
      <Text className="text-text-muted dark:text-text-muted font-[Inter_400Regular] mt-1 mb-6">{user?.phone || user?.email || "No contact info"}</Text>

      {/* Owner Business Analytics Card */}
      {isOwner && (
        <TouchableOpacity 
          className="w-full bg-accent-primary/10 border border-accent-primary/30 rounded-2xl p-4 mb-4 flex-row items-center justify-between"
          onPress={() => router.push("/owner/analytics")}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-accent-primary/20 items-center justify-center mr-3">
              <TrendingUp size={20} color={colors.accentPrimary} />
            </View>
            <View>
              <Text className="text-base font-[Inter_700Bold] text-text-primary dark:text-surface">
                Business Analytics 📊
              </Text>
              <Text className="text-xs text-text-muted font-[Inter_400Regular] mt-0.5">
                Revenue, bookings & occupancy
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.accentPrimary} />
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        className="w-full bg-surface dark:bg-surface rounded-xl py-4 items-center mb-4 flex-row justify-center border border-border"
        onPress={() => alert("Settings coming soon")}
      >
 <View style={{ marginRight: 8 }}>
 <Settings size={20} color="#9B9B9B" />
 </View>
 <Text className="text-text-primary dark:text-surface text-lg font-[Inter_600SemiBold]">Settings</Text>
 </TouchableOpacity>

 <TouchableOpacity 
 className="w-full bg-danger/10 dark:bg-surface border border-danger dark:border-danger rounded-xl py-4 items-center flex-row justify-center"
 onPress={() => {
 Alert.alert(
 "Log Out",
 "Are you sure you want to log out of your account?",
 [
 { text: "Cancel", style: "cancel" },
 { 
 text: "Log Out", 
 style: "destructive",
 onPress: async () => {
 try {
   await mixpanel.track("user_logged_out");
   await mixpanel.reset();
   await unregisterPushNotificationsAsync();
    await authApi.signOut();
 } catch (e) {
   console.error(e);
 } finally {
   router.replace("/auth/login");
 }
 }
 }
 ]
 );
 }}
 >
 <View style={{ marginRight: 8 }}>
 <LogOut size={20} color="#EF4444" />
 </View>
 <Text className="text-danger text-lg font-[Inter_600SemiBold]">Log Out</Text>
 </TouchableOpacity>
 </SafeAreaView>
 );
}
