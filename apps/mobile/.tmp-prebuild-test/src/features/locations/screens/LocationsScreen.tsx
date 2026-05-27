import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { ActiveItemsSection } from "@/src/features/discoveries/components/ActiveItemsSection";
import { JourneysSection } from "@/src/features/journeys/components/JourneysSection";
import { LocationsSection } from "@/src/features/locations/components/LocationsSection";

const TOP_LEVEL_TABS = [
  { key: "locations", label: "Locations" },
  { key: "journeys", label: "Journeys" },
  { key: "active", label: "Active" },
] as const;

type TopLevelTabKey = (typeof TOP_LEVEL_TABS)[number]["key"];

export function LocationsScreen() {
  const [activeTopLevelTab, setActiveTopLevelTab] =
    useState<TopLevelTabKey>("locations");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topLevelTabBar}>
        {TOP_LEVEL_TABS.map((tab) => {
          const isActive = activeTopLevelTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTopLevelTab(tab.key)}
              style={[
                styles.topLevelTabButton,
                isActive && styles.topLevelTabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.topLevelTabLabel,
                  isActive && styles.topLevelTabLabelActive,
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
    borderColor: "#D5D0C5",
    backgroundColor: "#FEFCF8",
    paddingVertical: 14,
  },
  topLevelTabButtonActive: {
    borderColor: "#0F766E",
    backgroundColor: "#0F766E",
  },
  topLevelTabLabel: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },
  topLevelTabLabelActive: {
    color: "#FFFFFF",
  },
});
