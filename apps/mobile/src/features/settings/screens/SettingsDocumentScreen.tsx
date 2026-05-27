import { Redirect } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type SettingsDocumentScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: {
    title: string;
    body: string;
  }[];
};

export function SettingsDocumentScreen({
  eyebrow,
  title,
  description,
  sections,
}: SettingsDocumentScreenProps) {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  const colors = {
    background: isDark ? "#020617" : "#F8FAFC",
    card: isDark ? "#0F172A" : "#FFFFFF",
    cardBorder: isDark ? "#1E293B" : "#E2E8F0",
    title: isDark ? "#F8FAFC" : "#0F172A",
    body: isDark ? "#CBD5E1" : "#475569",
    accent: isDark ? "#5EEAD4" : "#0F766E",
  };

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
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.body }]}>
          {description}
        </Text>
      </View>

      {sections.map((section) => (
        <View
          key={section.title}
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            {section.title}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.body }]}>
            {section.body}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
  },
});
