import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { authApi } from "../../lib/authApi";
import { useThemeColors } from "../../lib/theme-colors";

export default function LoginScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const colors = useThemeColors();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      let finalIdentifier = identifier.trim();
      if (!finalIdentifier.includes('@') && /^\d{10}$/.test(finalIdentifier)) {
        finalIdentifier = `+91${finalIdentifier}`;
      } else if (!finalIdentifier.includes('@') && /^\d+$/.test(finalIdentifier) && !finalIdentifier.startsWith('+')) {
        finalIdentifier = `+91${finalIdentifier}`;
      }

      if (loginMethod === "password") {
        await authApi.signIn(finalIdentifier, password);
      } else {
        await authApi.verifyOtp(finalIdentifier, otp);
      }
      
      const session = await authApi.getSession();
      if (session?.user) {
        await AsyncStorage.setItem("user", JSON.stringify(session.user));
      }
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      let finalIdentifier = identifier.replace(/[^0-9]/g, '');
      if (finalIdentifier.length !== 10) {
        throw new Error("Please enter a valid 10-digit phone number");
      }
      finalIdentifier = `+91${finalIdentifier}`;

      await authApi.sendOtp(finalIdentifier);
      setShowOtpField(true);
    } catch (err: any) {
      setError(typeof err.message === 'string' ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-surface dark:bg-surface">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface"
            >
              <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-[Inter_700Bold] text-text-primary dark:text-surface">
              Welcome Back
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <View className="bg-danger/10 dark:bg-surface border border-danger dark:border-danger rounded-xl p-4 mb-4">
              <Text className="text-danger font-[Inter_500Medium]">{error}</Text>
            </View>
          ) : null}

          <View className="flex-1 space-y-4">
            {/* Input field */}
            {loginMethod === "otp" ? (
              <View key="phone-input" className="min-h-[76px]">
                <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1">Phone Number</Text>
                <View className="flex-row w-full h-14 bg-surface dark:bg-surface border border-border dark:border-border rounded-xl px-4 items-center justify-center">
                  <Text className="text-base text-text-primary dark:text-surface font-[Inter_500Medium] mr-2" style={{ textAlignVertical: 'center' }}>+91</Text>
                  <TextInput 
                    className="flex-1 text-base text-text-primary dark:text-surface font-[Inter_400Regular]"
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    placeholder="Enter 10 digit number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={identifier}
                    onChangeText={(text) => setIdentifier(text.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </View>
            ) : (
              <View key="email-input" className="min-h-[76px]">
                <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1">Email or Phone Number</Text>
                <View className="w-full h-14 bg-surface dark:bg-surface border border-border dark:border-border rounded-xl px-4 justify-center">
                  <TextInput 
                    className="w-full text-base text-text-primary dark:text-surface font-[Inter_400Regular]"
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    placeholder="Enter email or phone"
                    placeholderTextColor={colors.textMuted}
                    value={identifier}
                    onChangeText={(text) => setIdentifier(text.trim())}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* Tab Switcher */}
            <View className="flex-row p-1 bg-surface dark:bg-border rounded-xl my-2 h-12 items-center">
              <TouchableOpacity
                key="tab-pwd"
                className="flex-1 h-full justify-center items-center rounded-lg bg-surface dark:bg-surface shadow-sm"
                style={{ opacity: loginMethod === "password" ? 1 : 0.6 }}
                onPress={() => { setLoginMethod("password"); setShowOtpField(false); }}
              >
                <Text className={`font-[Inter_600SemiBold] text-sm ${loginMethod === "password" ? "text-text-primary dark:text-surface" : "text-text-muted"}`}>
                  Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                key="tab-otp"
                className="flex-1 h-full justify-center items-center rounded-lg bg-surface dark:bg-surface shadow-sm"
                style={{ opacity: loginMethod === "otp" ? 1 : 0.6 }}
                onPress={() => setLoginMethod("otp")}
              >
                <Text className={`font-[Inter_600SemiBold] text-sm ${loginMethod === "otp" ? "text-text-primary dark:text-surface" : "text-text-muted"}`}>
                  Get OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* Password / OTP fields */}
            {loginMethod === "password" ? (
              <View key="password-field" className="min-h-[76px]">
                <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1">Password</Text>
                <View className="relative w-full h-14 bg-surface dark:bg-surface border border-border dark:border-border rounded-xl px-4 flex-row items-center">
                  <TextInput 
                    className="flex-1 h-full text-base text-text-primary dark:text-surface font-[Inter_400Regular] p-0 pr-8"
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute right-4" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showPassword ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              showOtpField ? (
                <View key="otp-field" className="min-h-[76px]">
                  <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1">Enter OTP</Text>
                  <View className="w-full h-14 bg-surface dark:bg-surface border border-border dark:border-border rounded-xl px-4 justify-center">
                    <TextInput 
                      className="w-full h-full text-center text-2xl tracking-widest text-text-primary dark:text-surface font-[Inter_700Bold] p-0"
                      placeholder="0000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                  <Text className="text-xs text-accent-primary mt-2 font-[Inter_400Regular]">
                    OTP sent via WhatsApp to your phone number.
                  </Text>
                </View>
              ) : null
            )}

            {/* Action Button */}
            <View className="mt-8">
              {loginMethod === "otp" && !showOtpField ? (
                <TouchableOpacity
                  key="btn-send-otp"
                  className="w-full bg-accent-primary rounded-xl py-4 items-center"
                  style={{ opacity: loading ? 0.6 : 1 }}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <Text className="text-white text-lg font-[Inter_600SemiBold]">
                    {loading ? "Sending..." : "Send OTP"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key="btn-login"
                  className="w-full bg-accent-primary rounded-xl py-4 items-center"
                  style={{ opacity: loading ? 0.6 : 1 }}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text className="text-white text-lg font-[Inter_600SemiBold]">
                    {loading ? "Logging in..." : "Login"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View className="mt-auto pt-8 items-center flex-row justify-center">
            <Text className="text-text-muted font-[Inter_400Regular]">Don't have an account? </Text>
            <TouchableOpacity 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => router.push("/auth/signup")}
            >
              <Text className="text-accent-primary dark:text-text-muted font-[Inter_600SemiBold]">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
