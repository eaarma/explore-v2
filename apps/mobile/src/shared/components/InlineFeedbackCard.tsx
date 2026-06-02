import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type InlineFeedbackCardProps = {
  message: string;
  tone?: "success" | "warning" | "error" | "neutral";
};

export function InlineFeedbackCard({
  message,
  tone = "error",
}: InlineFeedbackCardProps) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getInlineFeedbackColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgrounds[tone],
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.texts[tone],
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

function getInlineFeedbackColors(isDark: boolean) {
  if (isDark) {
    return {
      backgrounds: {
        neutral: "#1E293B",
        success: "#134E4A",
        warning: "#78350F",
        error: "#7F1D1D",
      },
      texts: {
        neutral: "#F8FAFC",
        success: "#CCFBF1",
        warning: "#FEF3C7",
        error: "#FEE2E2",
      },
    } as const;
  }

  return {
    backgrounds: {
      neutral: "#E2E8F0",
      success: "#CCFBF1",
      warning: "#FEF3C7",
      error: "#FEE2E2",
    },
    texts: {
      neutral: "#0F172A",
      success: "#115E59",
      warning: "#92400E",
      error: "#B91C1C",
    },
  } as const;
}

function createStyles(colors: ReturnType<typeof getInlineFeedbackColors>) {
  return StyleSheet.create({
    card: {
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    text: {
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
    },
  });
}
