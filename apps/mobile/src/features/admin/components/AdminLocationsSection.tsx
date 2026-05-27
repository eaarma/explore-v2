import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminLocationCreateSection } from "@/src/features/admin/components/AdminLocationCreateSection";
import { AdminLocationViewEditSection } from "@/src/features/admin/components/AdminLocationViewEditSection";
import { AdminColors } from "@/src/features/admin/utils/adminScreenTheme";

type AdminLocationsTabKey = "view-edit" | "add";

const LOCATION_ADMIN_TABS: {
  key: AdminLocationsTabKey;
  label: string;
}[] = [
  {
    key: "view-edit",
    label: "View / Edit",
  },
  {
    key: "add",
    label: "Add Location",
  },
];

type AdminLocationsSectionProps = {
  colors: AdminColors;
};

export function AdminLocationsSection({ colors }: AdminLocationsSectionProps) {
  const [activeTab, setActiveTab] = useState<AdminLocationsTabKey>("view-edit");

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {LOCATION_ADMIN_TABS.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [
                styles.tabButton,
                {
                  backgroundColor: isActive ? colors.subtleAccent : colors.card,
                  borderColor: isActive ? colors.accent : colors.cardBorder,
                },
                pressed && styles.tabButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color: isActive ? colors.accent : colors.title,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "view-edit" ? (
        <View style={styles.contentPane}>
          <AdminLocationViewEditSection />
        </View>
      ) : (
        <View style={styles.contentPane}>
          <AdminLocationCreateSection />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 18,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 12,
  },
  contentPane: {
    flex: 1,
    minHeight: 0,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  tabButtonPressed: {
    opacity: 0.84,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
