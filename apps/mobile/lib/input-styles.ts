import { Platform, StyleSheet } from "react-native";

export const inputStyles = StyleSheet.create({
  native: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    ...(Platform.OS === "ios"
      ? {
          height: 26,
        }
      : {
          height: "100%",
          textAlignVertical: "center" as const,
          includeFontPadding: false,
        }),
  },
  otp: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    textAlign: "center" as const,
    letterSpacing: 6,
    ...(Platform.OS === "ios"
      ? {
          height: 36,
        }
      : {
          height: "100%",
          textAlignVertical: "center" as const,
          includeFontPadding: false,
        }),
  },
  textarea: {
    paddingHorizontal: 0,
    paddingTop: Platform.OS === "ios" ? 4 : 0,
    paddingBottom: 0,
    margin: 0,
    textAlignVertical: "top" as const,
    fontSize: 15,
    lineHeight: 22,
    ...(Platform.OS === "android"
      ? {
          includeFontPadding: false,
        }
      : {}),
  },
  numberModal: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    textAlign: "center" as const,
    ...(Platform.OS === "ios"
      ? {
          height: 38,
        }
      : {
          height: "100%",
          textAlignVertical: "center" as const,
          includeFontPadding: false,
        }),
  },
});

