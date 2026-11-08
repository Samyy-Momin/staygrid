import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authApi } from "../../lib/authApi";
import { StayGridTextField } from "../../components/ui/StayGridTextField";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState((params.name as string) || "");
  const [email, setEmail] = useState((params.email as string) || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("Male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      const session = await authApi.getSession();
      if (session?.user) {
        if (session.user.name && !name) setName(session.user.name);
        if (session.user.email && !email) setEmail(session.user.email);
        if (session.user.phone) {
          // If phone already exists, go home
          router.replace("/(tabs)/home");
        }
      }
    };
    loadSession();
  }, []);

  const handleSubmit = async () => {
    setError("");
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    if (cleanDigits.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${cleanDigits}`;
      const res = await authApi.completeProfile({
        phone: formattedPhone,
        name: name.trim(),
        age: Number(age) || undefined,
        gender: gender || undefined,
        email: email.trim(),
      });

      if (res?.user) {
        await AsyncStorage.setItem("user", JSON.stringify(res.user));
      }
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-surface dark:bg-surface">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text className="text-3xl font-[Inter_800ExtraBold] text-text-primary dark:text-surface mb-2">
            Almost There!
          </Text>
          <Text className="text-sm text-text-muted font-[Inter_500Medium] mb-6 leading-relaxed">
            Please complete your mobile number details to receive booking tickets, caretaker contact numbers, and stay updates.
          </Text>

          {error ? (
            <View className="bg-danger/10 border border-danger rounded-xl p-4 mb-4">
              <Text className="text-danger font-[Inter_500Medium]">{error}</Text>
            </View>
          ) : null}

          <View className="space-y-4 flex-1">
            <StayGridTextField
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />

            <StayGridTextField
              label="Phone Number (Required)"
              value={phone}
              onChangeText={v => setPhone(v.replace(/[^0-9]/g, ''))}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              prefix={
                <Text className="text-base text-text-primary dark:text-surface font-[Inter_500Medium]">
                  +91
                </Text>
              }
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <StayGridTextField
                  label="Age"
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1.5">Gender</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity 
                    onPress={() => setGender("Male")}
                    className={`flex-1 h-12 rounded-xl border items-center justify-center ${gender === "Male" ? "bg-surface border-accent-primary dark:bg-surface" : "bg-surface border-border dark:bg-surface dark:border-border"}`}
                  >
                    <Text className={`text-base font-[Inter_500Medium] ${gender === "Male" ? "text-accent-primary dark:text-text-muted" : "text-text-muted"}`}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setGender("Female")}
                    className={`flex-1 h-12 rounded-xl border items-center justify-center ${gender === "Female" ? "bg-surface border-accent-primary dark:bg-surface" : "bg-surface border-border dark:bg-surface dark:border-border"}`}
                  >
                    <Text className={`text-base font-[Inter_500Medium] ${gender === "Female" ? "text-accent-primary dark:text-text-muted" : "text-text-muted"}`}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="w-full bg-accent-primary rounded-xl py-4 items-center mt-8"
            style={{ opacity: loading ? 0.6 : 1 }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white text-lg font-[Inter_600SemiBold]">
              {loading ? "Saving..." : "Save & Continue"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
