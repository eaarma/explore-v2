import { Redirect, router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAdminScreenColors } from "@/src/features/admin/utils/adminScreenTheme";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

const ADMIN_MENU_OPTIONS: {
  label: string;
  description: string;
  href:
    | "/admin-locations"
    | "/admin-journeys"
    | "/admin-users"
    | "/admin-operations"
    | "/admin-customize";
}[] = [
  {
    label: "Locations",
    description: "Review, edit, and add places.",
    href: "/admin-locations",
  },
  {
    label: "Journeys",
    description: "Manage routes, stops, and journey content.",
    href: "/admin-journeys",
  },
  {
    label: "Users",
    description: "Browse accounts, roles, and statuses.",
    href: "/admin-users",
  },
  {
    label: "Operations",
    description: "Run backups and review maintenance status.",
    href: "/admin-operations",
  },
  {
    label: "Customize",
    description: "Manage legal copy and other app-facing text settings.",
    href: "/admin-customize",
  },
];

export function AdminScreen() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const colorScheme = useColorScheme();
  const colors = getAdminScreenColors(colorScheme === "dark");

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  if (userRole !== "ADMIN") {
    return <Redirect href="/map" />;
  }

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.eyebrow,
            {
              color: colors.accent,
            },
          ]}
        >
          Admin tools
        </Text>
        <Text
          style={[
            styles.title,
            {
              color: colors.title,
            },
          ]}
        >
          Management
        </Text>
      </View>

      <View style={styles.menuList}>
        {ADMIN_MENU_OPTIONS.map((option) => (
          <Pressable
            key={option.href}
            accessibilityRole="button"
            onPress={() => router.push(option.href)}
            style={({ pressed }) => [
              styles.menuCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                shadowColor: colorScheme === "dark" ? "#020617" : "#0F172A",
              },
              pressed && styles.menuCardPressed,
            ]}
          >
            <View style={styles.menuCardContent}>
              <View style={styles.menuCardCopy}>
                <Text
                  style={[
                    styles.menuButtonText,
                    {
                      color: colors.title,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.menuButtonDescription,
                    {
                      color: colors.body,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </View>

              <View
                style={[
                  styles.menuArrowBadge,
                  {
                    backgroundColor: colors.subtleAccent,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.menuButtonArrow,
                    {
                      color: colors.accent,
                    },
                  ]}
                >
                  {"›"}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 18,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  menuList: {
    gap: 12,
  },
  menuCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 17,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  menuCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  menuCardCopy: {
    flex: 1,
    gap: 4,
  },
  menuCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  menuButtonDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  menuArrowBadge: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonArrow: {
    fontSize: 18,
    fontWeight: "700",
  },
});
