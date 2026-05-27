import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type CategoryImagePlaceholderProps = {
  categoryLabel: string;
  size: "small" | "large";
  style?: StyleProp<ViewStyle>;
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type PlaceholderVisual = {
  badge: string;
  base: string;
  glowPrimary: string;
  glowSecondary: string;
  icon: IoniconName;
  text: string;
};

export function CategoryImagePlaceholder({
  categoryLabel,
  size,
  style,
}: CategoryImagePlaceholderProps) {
  const isDark = useColorScheme() === "dark";
  const visual = getPlaceholderVisual(categoryLabel, isDark);
  const isSmall = size === "small";

  return (
    <View style={[styles.root, { backgroundColor: visual.base }, style]}>
      <View
        style={[
          styles.glowPrimary,
          { backgroundColor: visual.glowPrimary },
        ]}
      />
      <View
        style={[
          styles.glowSecondary,
          { backgroundColor: visual.glowSecondary },
        ]}
      />
      <View
        style={[
          styles.sheen,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.42)",
          },
        ]}
      />

      <View style={[styles.content, isSmall ? styles.contentSmall : styles.contentLarge]}>
        <View
          style={[
            styles.iconBadge,
            isSmall ? styles.iconBadgeSmall : styles.iconBadgeLarge,
            { backgroundColor: visual.badge },
          ]}
        >
          <Ionicons
            color={visual.text}
            name={visual.icon}
            size={isSmall ? 18 : 26}
          />
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.label,
            isSmall ? styles.labelSmall : styles.labelLarge,
            { color: visual.text },
          ]}
        >
          {categoryLabel}
        </Text>
      </View>
    </View>
  );
}

function getPlaceholderVisual(
  categoryLabel: string,
  isDark: boolean,
): PlaceholderVisual {
  switch (categoryLabel) {
    case "Nature":
    case "Hiking":
      return isDark
        ? {
            badge: "rgba(16,185,129,0.24)",
            base: "#0F2E2A",
            glowPrimary: "rgba(74,222,128,0.30)",
            glowSecondary: "rgba(187,247,208,0.18)",
            icon: "leaf-outline",
            text: "#D1FAE5",
          }
        : {
            badge: "rgba(255,255,255,0.68)",
            base: "#DDF6E8",
            glowPrimary: "rgba(52,211,153,0.34)",
            glowSecondary: "rgba(167,243,208,0.36)",
            icon: "leaf-outline",
            text: "#166534",
          };
    case "Historic":
      return isDark
        ? {
            badge: "rgba(251,146,60,0.24)",
            base: "#342314",
            glowPrimary: "rgba(251,146,60,0.26)",
            glowSecondary: "rgba(253,186,116,0.18)",
            icon: "library-outline",
            text: "#FED7AA",
          }
        : {
            badge: "rgba(255,255,255,0.68)",
            base: "#F7E6D6",
            glowPrimary: "rgba(249,115,22,0.28)",
            glowSecondary: "rgba(253,186,116,0.28)",
            icon: "library-outline",
            text: "#9A3412",
          };
    case "Camping":
      return isDark
        ? {
            badge: "rgba(245,158,11,0.24)",
            base: "#31230A",
            glowPrimary: "rgba(245,158,11,0.28)",
            glowSecondary: "rgba(253,224,71,0.18)",
            icon: "bonfire-outline",
            text: "#FDE68A",
          }
        : {
            badge: "rgba(255,255,255,0.68)",
            base: "#F9E8C8",
            glowPrimary: "rgba(245,158,11,0.28)",
            glowSecondary: "rgba(253,224,71,0.28)",
            icon: "bonfire-outline",
            text: "#92400E",
          };
    case "Sightseeing":
      return isDark
        ? {
            badge: "rgba(14,165,233,0.24)",
            base: "#10293A",
            glowPrimary: "rgba(56,189,248,0.28)",
            glowSecondary: "rgba(125,211,252,0.18)",
            icon: "camera-outline",
            text: "#BAE6FD",
          }
        : {
            badge: "rgba(255,255,255,0.68)",
            base: "#DDEFFC",
            glowPrimary: "rgba(14,165,233,0.28)",
            glowSecondary: "rgba(125,211,252,0.30)",
            icon: "camera-outline",
            text: "#0C4A6E",
          };
    case "Urbex":
      return isDark
        ? {
            badge: "rgba(100,116,139,0.26)",
            base: "#1A2230",
            glowPrimary: "rgba(148,163,184,0.22)",
            glowSecondary: "rgba(203,213,225,0.14)",
            icon: "compass-outline",
            text: "#E2E8F0",
          }
        : {
            badge: "rgba(255,255,255,0.68)",
            base: "#E4EBF3",
            glowPrimary: "rgba(148,163,184,0.24)",
            glowSecondary: "rgba(203,213,225,0.30)",
            icon: "compass-outline",
            text: "#334155",
          };
    case "Adventure":
      return isDark
        ? {
            badge: "rgba(6,182,212,0.24)",
            base: "#10292F",
            glowPrimary: "rgba(34,211,238,0.26)",
            glowSecondary: "rgba(165,243,252,0.16)",
            icon: "compass-outline",
            text: "#CFFAFE",
          }
        : {
            badge: "rgba(255,255,255,0.68)",
            base: "#DCF3F5",
            glowPrimary: "rgba(6,182,212,0.24)",
            glowSecondary: "rgba(165,243,252,0.28)",
            icon: "compass-outline",
            text: "#155E75",
          };
    default:
      return isDark
        ? {
            badge: "rgba(148,163,184,0.22)",
            base: "#172030",
            glowPrimary: "rgba(148,163,184,0.20)",
            glowSecondary: "rgba(226,232,240,0.12)",
            icon: "image-outline",
            text: "#E2E8F0",
          }
        : {
            badge: "rgba(255,255,255,0.68)",
            base: "#E8EDF3",
            glowPrimary: "rgba(148,163,184,0.22)",
            glowSecondary: "rgba(226,232,240,0.28)",
            icon: "image-outline",
            text: "#334155",
          };
  }
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  glowPrimary: {
    borderRadius: 999,
    height: "92%",
    opacity: 0.95,
    position: "absolute",
    right: -24,
    top: -26,
    width: "88%",
  },
  glowSecondary: {
    borderRadius: 999,
    bottom: -22,
    height: "74%",
    left: -18,
    opacity: 0.9,
    position: "absolute",
    width: "72%",
  },
  sheen: {
    borderRadius: 999,
    height: "52%",
    left: "-24%",
    opacity: 0.42,
    position: "absolute",
    top: "-10%",
    transform: [{ rotate: "-12deg" }],
    width: "150%",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentSmall: {
    gap: 6,
    paddingHorizontal: 8,
  },
  contentLarge: {
    gap: 10,
    paddingHorizontal: 18,
  },
  iconBadge: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
  },
  iconBadgeSmall: {
    height: 34,
    width: 34,
  },
  iconBadgeLarge: {
    height: 48,
    width: 48,
  },
  label: {
    fontWeight: "700",
    textAlign: "center",
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 15,
  },
  labelLarge: {
    fontSize: 16,
    lineHeight: 20,
  },
});
