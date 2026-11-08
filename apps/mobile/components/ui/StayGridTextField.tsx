import React from "react";
import { View, Text, TextInput, TextInputProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { useThemeColors } from "../../lib/theme-colors";
import { inputStyles } from "../../lib/input-styles";

export interface StayGridTextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function StayGridTextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  secureTextEntry,
  autoCapitalize = "none",
  autoCorrect = false,
  prefix,
  suffix,
  error,
  helperText,
  containerClassName,
  style,
  containerStyle,
}: StayGridTextFieldProps) {
  const colors = useThemeColors();

  return (
    <View className={`w-full ${containerClassName || ""}`}>
      {label ? (
        <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className="w-full bg-surface dark:bg-surface border border-border dark:border-border rounded-xl px-4 flex-row items-center"
        style={[{ height: 52, minHeight: 52 }, containerStyle]}
      >
        {prefix ? (
          <View className="justify-center items-center mr-2">
            {prefix}
          </View>
        ) : null}

        <TextInput
          className="flex-1 text-base text-text-primary dark:text-surface font-[Inter_400Regular]"
          style={[
            inputStyles.native,
            {
              fontSize: 16,
              color: colors.textPrimary,
            },
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />

        {suffix ? (
          <View className="justify-center items-center ml-2">
            {suffix}
          </View>
        ) : null}
      </View>

      {error ? (
        <Text className="text-xs text-danger font-[Inter_500Medium] mt-1">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs text-accent-primary font-[Inter_400Regular] mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

export interface StayGridTextAreaProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  numberOfLines?: number;
  minHeight?: number;
  style?: StyleProp<TextStyle>;
}

export function StayGridTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  containerClassName,
  numberOfLines = 3,
  minHeight = 90,
  style,
}: StayGridTextAreaProps) {
  const colors = useThemeColors();

  return (
    <View className={`w-full ${containerClassName || ""}`}>
      {label ? (
        <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className="w-full bg-surface dark:bg-surface border border-border dark:border-border rounded-xl p-3.5"
        style={{ minHeight }}
      >
        <TextInput
          className="w-full text-base text-text-primary dark:text-surface font-[Inter_400Regular]"
          style={[
            inputStyles.textarea,
            {
              color: colors.textPrimary,
              minHeight: minHeight - 28,
            },
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={numberOfLines}
        />
      </View>

      {error ? (
        <Text className="text-xs text-danger font-[Inter_500Medium] mt-1">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs text-accent-primary font-[Inter_400Regular] mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

export interface StayGridOtpFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  helperText?: string;
}

export function StayGridOtpField({
  label = "Enter OTP",
  value,
  onChangeText,
  placeholder = "0000",
  maxLength = 4,
  error,
  helperText,
}: StayGridOtpFieldProps) {
  const colors = useThemeColors();

  return (
    <View className="w-full">
      {label ? (
        <Text className="text-sm font-[Inter_500Medium] text-text-primary dark:text-text-muted mb-1.5">
          {label}
        </Text>
      ) : null}

      <View 
        className="w-full bg-surface dark:bg-surface border border-border dark:border-border rounded-xl px-4 justify-center items-center"
        style={{ height: 56, minHeight: 56 }}
      >
        <TextInput
          className="w-full text-center text-text-primary dark:text-surface font-[Inter_700Bold]"
          style={[
            inputStyles.otp,
            {
              color: colors.textPrimary,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={maxLength}
        />
      </View>

      {error ? (
        <Text className="text-xs text-danger font-[Inter_500Medium] mt-1">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs text-accent-primary font-[Inter_400Regular] mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
