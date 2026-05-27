import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { ActiveItemsSection } from "@/src/features/discoveries/components/ActiveItemsSection";
import { JourneysSection } from "@/src/features/journeys/components/JourneysSection";
import { LocationsSection } from "@/src/features/locations/components/LocationsSection";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

const TOP_LEVEL_TABS = [
  { key: "locations", label: "Locations" },
  { key: "journeys", label: "Journeys" },
  { key: "active", label: "Active" },
] as const;

type TopLevelTabKey = (typeof TOP_LEVEL_TABS)[number]["key"];

export function LocationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTopLevelTab, setActiveTopLevelTab] =
    useState<TopLevelTabKey>("locations");

  const screenColors = isDark
    ? {
        background: "#020617",
        tabBorder: "#334155",
        tabBackground: "#0F172A",
        tabActiveBorder: "#2DD4BF",
        tabActiveBackground: "#115E59",
        tabText: "#E2E8F0",
        tabActiveText: "#FFFFFF",
      }
    : {
        background: "#F4EFE6",
        tabBorder: "#D5D0C5",
        tabBackground: "#FEFCF8",
        tabActiveBorder: "#0F766E",
        tabActiveBackground: "#0F766E",
        tabText: "#334155",
        tabActiveText: "#FFFFFF",
      };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: screenColors.background }]}
    >
      <View style={styles.topLevelTabBar}>
        {TOP_LEVEL_TABS.map((tab) => {
          const isActive = activeTopLevelTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTopLevelTab(tab.key)}
              style={[
                styles.topLevelTabButton,
                {
                  borderColor: isActive
                    ? screenColors.tabActiveBorder
                    : screenColors.tabBorder,
                  backgroundColor: isActive
                    ? screenColors.tabActiveBackground
                    : screenColors.tabBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.topLevelTabLabel,
                  {
                    color: isActive
                      ? screenColors.tabActiveText
                      : screenColors.tabText,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTopLevelTab === "locations" ? <LocationsSection /> : null}
      {activeTopLevelTab === "journeys" ? <JourneysSection /> : null}
      {activeTopLevelTab === "active" ? <ActiveItemsSection /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4EFE6",
  },
  topLevelTabBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topLevelTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
  },
  topLevelTabLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});
