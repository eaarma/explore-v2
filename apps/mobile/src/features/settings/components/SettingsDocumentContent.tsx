import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export type SettingsDocumentSection = {
  body?: string;
  items?: string[];
  title: string;
};

export type SettingsDocument = {
  description: string;
  eyebrow: string;
  sections: SettingsDocumentSection[];
  title: string;
};

export function SettingsDocumentContent({
  document,
}: {
  document: SettingsDocument;
}) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getSettingsDocumentColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.content}>
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          {document.eyebrow}
        </Text>
        <Text style={[styles.title, { color: colors.title }]}>
          {document.title}
        </Text>
        <Text style={[styles.description, { color: colors.body }]}>
          {document.description}
        </Text>
      </View>

      {document.sections.map((section) => (
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

          {section.body ? (
            <Text style={[styles.sectionBody, { color: colors.body }]}>
              {section.body}
            </Text>
          ) : null}

          {section.items?.length ? (
            <View style={styles.bulletList}>
              {section.items.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <View
                    style={[
                      styles.bulletDot,
                      {
                        backgroundColor: colors.accent,
                      },
                    ]}
                  />
                  <Text style={[styles.bulletText, { color: colors.body }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function getSettingsDocumentColors(isDark: boolean) {
  return {
    background: isDark ? "#020617" : "#F8FAFC",
    card: isDark ? "#0F172A" : "#FFFFFF",
    cardBorder: isDark ? "#1E293B" : "#E2E8F0",
    title: isDark ? "#F8FAFC" : "#0F172A",
    body: isDark ? "#CBD5E1" : "#475569",
    accent: isDark ? "#5EEAD4" : "#0F766E",
  };
}

function createStyles(colors: ReturnType<typeof getSettingsDocumentColors>) {
  return StyleSheet.create({
    content: {
      padding: 20,
      gap: 18,
      backgroundColor: colors.background,
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
    bulletList: {
      gap: 10,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    bulletDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginTop: 7,
    },
    bulletText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
    },
  });
}
