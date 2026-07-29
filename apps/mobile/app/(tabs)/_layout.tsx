import { Tabs } from "expo-router";
import { Home, Calendar, User } from "lucide-react-native";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
 const colorScheme = useColorScheme();
 const isDark = colorScheme === "dark";
 const insets = useSafeAreaInsets();

 return (
 <Tabs
 screenOptions={{
 headerShown: false,
 tabBarStyle: {
 backgroundColor: isDark ? "#3A3A3C" : "#FBFBF9",
 borderTopWidth: 1,
 borderTopColor: isDark ? "#27272a" : "#f4f4f5",
 height: 60 + Math.max(insets.bottom, 10),
 paddingBottom: Math.max(insets.bottom, 10),
 paddingTop: 8,
 },
 tabBarActiveTintColor: isDark ? "#38bdf8" : "#0066CC", // Sky
 tabBarInactiveTintColor: isDark ? "#9B9B9B" : "#9B9B9B", // Zinc
 tabBarLabelStyle: {
 fontFamily: "Inter_500Medium",
 fontSize: 12,
 },
 }}
 >
 <Tabs.Screen
 name="home"
 options={{
 title: "Discover",
 tabBarIcon: ({ color, size }) => (
 <Home color={color} size={size} strokeWidth={2.5} />
 ),
 }}
 />
 <Tabs.Screen
 name="bookings"
 options={{
 title: "Bookings",
 tabBarIcon: ({ color, size }) => (
 <Calendar color={color} size={size} strokeWidth={2.5} />
 ),
 }}
 />
 <Tabs.Screen
 name="profile"
 options={{
 title: "Profile",
 tabBarIcon: ({ color, size }) => (
 <User color={color} size={size} strokeWidth={2.5} />
 ),
 }}
 />
 </Tabs>
 );
}
