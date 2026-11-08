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

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const colors = useThemeColors();

  const handleCreateAccount = async () => {
    setError("");
    const cleanFirstName = formData.firstName.trim().replace(/\s+/g, ' ');
    const cleanLastName = formData.lastName.trim().replace(/\s+/g, ' ');
    const email = formData.email.trim().toLowerCase();
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');

    if (!cleanFirstName || !cleanLastName || !email || !formData.password || !cleanPhone) {
      setError("Please fill in all required fields");
      return;
    }
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authApi.signUp({
        name: cleanFirstName + ' ' + cleanLastName,
        email,
        password: formData.password,
        phone: '+91' + cleanPhone,
        gender: formData.gender,
        age: formData.age ? Number(formData.age) : undefined,
      });
      await authApi.requestEmailOtp(email, 'email-verification');
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      await authApi.verifyEmailOtp(email, otp.trim());
      await authApi.signIn(email, formData.password);
      const session = await authApi.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await mixpanel.identify(userId);
        await mixpanel.setPeople({
          $name: cleanName(),
          $email: email,
          $phone: '+91' + formData.phone.replace(/[^0-9]/g, ''),
          role: "CUSTOMER",
          gender: formData.gender || undefined,
          age: formData.age ? Number(formData.age) : undefined,
        });
        await mixpanel.track("sign_up_completed", { sign_up_method: "email_otp", platform: "mobile" });
      }
      await registerForPushNotificationsAsync();
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.message || "Invalid verification code or login failed");
    } finally {
      setLoading(false);
    }
  };

  const cleanName = () => formData.firstName.trim() + ' ' + formData.lastName.trim();

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity 
              onPress={() => step === 2 ? setStep(1) : router.back()} 
              className="mr-4 p-2 -ml-2 rounded-full bg-surface dark:bg-surface"
            >
              <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold]">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-[Inter_700Bold] text-text-primary dark:text-surface">
              {step === 1 ? "Create Account" : "Verify Email"}
            </Text>
          </View>

          {error ? (
            <View className="bg-danger/10 dark:bg-surface border border-danger dark:border-danger rounded-xl p-4 mb-4">
              <Text className="text-danger font-[Inter_500Medium]">{error}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <View className="space-y-4 flex-1">
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <StayGridTextField
                    label="First Name"
                    value={formData.firstName}
                    onChangeText={v => setFormData({...formData, firstName: v})}
                    placeholder="John"
                  />
                </View>
                <View className="flex-1">
                  <StayGridTextField
                    label="Last Name"
                    value={formData.lastName}
                    onChangeText={v => setFormData({...formData, lastName: v})}
                    placeholder="Doe"
                  />
                </View>
              </View>

              <StayGridTextField
                label="Phone Number"
                value={formData.phone}
                onChangeText={v => setFormData({...formData, phone: v.replace(/[^0-9]/g, '')})}
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                prefix={
                  <Text className="text-base text-text-primary dark:text-surface font-[Inter_500Medium]">
                    +91
                  </Text>
                }
              />

              <StayGridTextField
                label="Email Address"
                value={formData.email}
                onChangeText={v => setFormData({...formData, email: v})}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <StayGridTextField
                    label="Age"
                    value={formData.age}
                    onChangeText={v => setFormData({...formData, age: v})}
                    placeholder="25"
                    keyboardType="number-pad"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1.5">Gender</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity 
                      onPress={() => setFormData({...formData, gender: "Male"})}
                      className={`flex-1 h-[52px] rounded-xl border items-center justify-center ${formData.gender === "Male" ? "bg-surface border-accent-primary dark:bg-surface" : "bg-surface border-border dark:bg-surface dark:border-border"}`}
                    >
                      <Text className={`text-base font-[Inter_500Medium] ${formData.gender === "Male" ? "text-accent-primary dark:text-text-muted" : "text-text-muted"}`}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setFormData({...formData, gender: "Female"})}
                      className={`flex-1 h-[52px] rounded-xl border items-center justify-center ${formData.gender === "Female" ? "bg-surface border-accent-primary dark:bg-surface" : "bg-surface border-border dark:bg-surface dark:border-border"}`}
                    >
                      <Text className={`text-base font-[Inter_500Medium] ${formData.gender === "Female" ? "text-accent-primary dark:text-text-muted" : "text-text-muted"}`}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <StayGridTextField
                label="Password"
                value={formData.password}
                onChangeText={v => setFormData({...formData, password: v})}
                placeholder="Create a strong password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                suffix={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showPassword ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                }
              />

              <StayGridTextField
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={v => setFormData({...formData, confirmPassword: v})}
                placeholder="Repeat your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                suffix={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showConfirmPassword ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity 
                className="w-full bg-accent-primary rounded-xl py-4 items-center mt-4 opacity-90"
                onPress={handleCreateAccount}
                disabled={loading}
              >
                <Text className="text-white text-lg font-[Inter_600SemiBold]">
                  {loading ? "Creating..." : "Continue"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4 flex-1 mt-8">
              <Text className="text-text-muted dark:text-text-muted font-[Inter_400Regular] text-center mb-4">
                We've sent a verification code to {formData.email}.
              </Text>
              <StayGridOtpField
                label="Enter email code"
                value={otp}
                placeholder="000000"
                maxLength={6}
                onChangeText={setOtp}
              />
              <TouchableOpacity 
                className="w-full bg-success rounded-xl py-4 items-center mt-4"
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                <Text className="text-white text-lg font-[Inter_600SemiBold]">{loading ? "Verifying..." : "Verify & Login"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View className="mt-6 pt-4 items-center flex-row justify-center">
              <Text className="text-text-muted font-[Inter_400Regular]">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text className="text-accent-primary dark:text-text-muted font-[Inter_600SemiBold]">Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
