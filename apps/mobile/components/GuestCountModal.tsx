import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Pressable, Alert } from "react-native";
import { BlurView } from "expo-blur";
import { X } from "lucide-react-native";
import { useThemeColors } from "../lib/theme-colors";
import { inputStyles } from "../lib/input-styles";

interface GuestCountModalProps {
  visible: boolean;
  title: string;
  initialValue: number;
  minValue?: number;
  maxValue?: number;
  onClose: () => void;
  onSave: (val: number) => void;
}

export function GuestCountModal({
  visible,
  title,
  initialValue,
  minValue = 0,
  maxValue = 50,
  onClose,
  onSave,
}: GuestCountModalProps) {
  const [val, setVal] = useState(initialValue.toString());
  const colors = useThemeColors();

  useEffect(() => {
    setVal(initialValue.toString());
  }, [initialValue, visible]);

  const handleSave = () => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < minValue) {
      onSave(minValue);
      onClose();
      return;
    }
    if (num > maxValue) {
      Alert.alert(
        "Limit Exceeded",
        `Maximum allowed count for this field is ${maxValue}.`
      );
      setVal(maxValue.toString());
      return;
    }
    onSave(num);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* Glass panel */}
        <BlurView intensity={85} tint={colors.isDark ? "dark" : "light"} style={styles.blurWrap}>
          <View
            className="w-full p-6"
            style={[styles.glassPanel, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-[Inter_700Bold] text-text-primary dark:text-surface">{title}</Text>
              <TouchableOpacity onPress={onClose} className="p-1" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-text-muted font-[Inter_500Medium] mb-3">
              Enter exact count ({minValue} - {maxValue}):
            </Text>

            <View className="w-full h-14 bg-surface dark:bg-border border border-border dark:border-border rounded-xl px-4 justify-center items-center mb-6">
              <TextInput
                className="w-full text-center text-2xl font-[Inter_700Bold] text-text-primary dark:text-surface"
                style={[inputStyles.numberModal, { color: colors.textPrimary }]}
                keyboardType="number-pad"
                value={val}
                maxLength={3}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  if (!cleaned) {
                    setVal("");
                    return;
                  }
                  const num = parseInt(cleaned, 10);
                  if (num > maxValue) {
                    setVal(maxValue.toString());
                  } else {
                    setVal(num.toString());
                  }
                }}
                autoFocus
                selectTextOnFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 py-3.5 rounded-2xl border border-border dark:border-border items-center">
                <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold] text-sm">Cancel</Text>
              </TouchableOpacity>

              <ClayButton label="Save" onPress={handleSave} />
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

function ClayButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.clayGlow} className="flex-1">
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.clayInner,
          { transform: [{ translateY: pressed ? 3 : 0 }], shadowOpacity: pressed ? 0 : 0.9 },
        ]}
        className="bg-accent-primary items-center justify-center rounded-2xl py-3.5"
      >
        <Text className="text-white font-[Inter_700Bold] text-sm">{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  blurWrap: { width: "100%", maxWidth: 360, borderRadius: 28, overflow: "hidden" },
  glassPanel: { borderRadius: 28, borderWidth: 1 },
  clayGlow: {
    borderRadius: 20,
    shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  clayInner: {
    borderRadius: 20,
    shadowColor: "#00336B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4,
  },
});
