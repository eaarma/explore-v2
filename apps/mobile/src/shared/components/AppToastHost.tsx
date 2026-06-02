import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  dismissAppToast,
  useAppFeedbackStore,
  type AppToastTone,
} from "@/src/shared/store/appFeedbackStore";

export function AppToastHost() {
  const activeToast = useAppFeedbackStore((state) => state.activeToast);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getToastColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    if (!activeToast) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(-60);

    Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 220,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    const timeoutId = setTimeout(() => {
      dismissAppToast();
    }, activeToast.durationMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeToast, opacity, translateY]);

  if (!activeToast) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.viewport,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        onPress={dismissAppToast}
        style={[
          styles.toast,
          {
            backgroundColor: colors.backgrounds[activeToast.tone],
            top: Math.max(insets.top, 12) + 32,
          },
        ]}
      >
        <Text
          style={[
            styles.toastText,
            {
              color: colors.texts[activeToast.tone],
            },
          ]}
        >
          {activeToast.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function getToastColors(isDark: boolean) {
  if (isDark) {
    return {
      shadow: "#020617",
      backgrounds: {
        neutral: "#1E293B",
        success: "#134E4A",
        warning: "#78350F",
        error: "#7F1D1D",
      } satisfies Record<AppToastTone, string>,
      texts: {
        neutral: "#F8FAFC",
        success: "#CCFBF1",
        warning: "#FEF3C7",
        error: "#FEE2E2",
      } satisfies Record<AppToastTone, string>,
    };
  }

  return {
    shadow: "#0F172A",
    backgrounds: {
      neutral: "#E2E8F0",
      success: "#CCFBF1",
      warning: "#FEF3C7",
      error: "#FEE2E2",
    } satisfies Record<AppToastTone, string>,
    texts: {
      neutral: "#0F172A",
      success: "#115E59",
      warning: "#92400E",
      error: "#B91C1C",
    } satisfies Record<AppToastTone, string>,
  };
}

function createStyles(colors: ReturnType<typeof getToastColors>) {
  return StyleSheet.create({
    viewport: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-start",
      zIndex: 999,
    },
    toast: {
      position: "absolute",
      left: 16,
      right: 16,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 7,
    },
    toastText: {
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
    },
  });
}
