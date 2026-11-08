import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { authApi } from "../../lib/authApi";
import { useThemeColors } from "../../lib/theme-colors";
import { StayGridTextField, StayGridOtpField } from "../../components/ui/StayGridTextField";
import { mixpanel } from "../../lib/mixpanel";
import { registerForPushNotificationsAsync } from "../../lib/notifications";

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
        await authApi.signIn(finalIdentifier, password.trim());
      } else {
        await authApi.signInEmailOtp(identifier.trim(), otp.trim());
      }
      
      const session = await authApi.getSession();
      if (session?.user) {
        await AsyncStorage.setItem("user", JSON.stringify(session.user));
        await mixpanel.identify(session.user.id);
        await mixpanel.setPeople({
          $name: session.user.name || "Customer",
          $email: session.user.email || undefined,
          $phone: session.user.phone || undefined,
          role: session.user.role || "CUSTOMER",
        });
        await mixpanel.track("user_logged_in", {
          login_method: loginMethod,
          role: session.user.role || "CUSTOMER",
        });
      }
      await registerForPushNotificationsAsync();
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
      const email = identifier.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }
      await authApi.requestEmailOtp(email, 'sign-in');
      setShowOtpField(true);
    } catch (err: any) {
      setError(typeof err.message === 'string' ? err.message : "Failed to send email code");
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
              <StayGridTextField
                key="otp-email-input"
                label="Email Address"
                value={identifier}
                onChangeText={(text) => setIdentifier(text.trim())}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <StayGridTextField
                key="email-input"
                label="Email or Phone Number"
                value={identifier}
                onChangeText={(text) => setIdentifier(text.trim())}
                placeholder="Enter email or phone"
                autoCapitalize="none"
              />
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
              <StayGridTextField
                key="password-field"
                label="Password"
                value={password}
                onChangeText={(val) => setPassword(val.trim())}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                suffix={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showPassword ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                }
              />
            ) : (
              showOtpField ? (
                <StayGridOtpField
                  key="otp-field"
                  label="Enter email code"
                  value={otp}
                  placeholder="000000"
                  maxLength={6}
                  onChangeText={setOtp}
                  helperText="Enter the code sent to your email address."
                />
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
                    {loading ? "Sending..." : "Send email code"}
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

            {/* Social Logins Divider & Buttons */}
            <View className="my-6 flex-row items-center justify-center">
              <View className="flex-1 h-px bg-border dark:bg-border" />
              <Text className="mx-4 text-xs font-[Inter_500Medium] text-text-muted">OR CONTINUE WITH</Text>
              <View className="flex-1 h-px bg-border dark:bg-border" />
            </View>

            <View className="space-y-3 gap-3">
              <TouchableOpacity
                onPress={() => {
                  router.push({ pathname: "/auth/complete-profile", params: { name: "", email: "" } });
                }}
                className="w-full h-14 bg-surface dark:bg-surface border border-border dark:border-border rounded-xl flex-row items-center justify-center"
              >
                <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold] text-base">
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={() => {
                    router.push({ pathname: "/auth/complete-profile", params: { name: "", email: "" } });
                  }}
                  className="w-full h-14 bg-black dark:bg-white rounded-xl flex-row items-center justify-center"
                >
                  <Text className="text-white dark:text-black font-[Inter_600SemiBold] text-base">
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View className="mt-auto pt-8 items-center space-y-3">
            <View className="flex-row items-center justify-center">
              <Text className="text-text-muted font-[Inter_400Regular]">Don't have an account? </Text>
              <TouchableOpacity 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => router.push("/auth/signup")}
              >
                <Text className="text-accent-primary dark:text-text-muted font-[Inter_600SemiBold]">Sign Up</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-text-muted text-center font-[Inter_400Regular] px-4 leading-relaxed">
              By logging in, you agree to StayGrid's{" "}
              <Text className="text-[#0066CC] font-[Inter_600SemiBold] underline" onPress={() => router.push("/auth/terms")}>Terms & Conditions</Text>
              {" "}and{" "}
              <Text className="text-[#0066CC] font-[Inter_600SemiBold] underline" onPress={() => router.push("/auth/privacy")}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
