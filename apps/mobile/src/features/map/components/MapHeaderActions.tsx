import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { HeaderMoreMenu } from "@/src/shared/components/HeaderMoreMenu";

type MapHeaderActionColors = {
  background: string;
  border: string;
  pressedBackground: string;
  text: string;
};

type MapHeaderActionsProps = {
  isSearchActive: boolean;
  isLegendActive: boolean;
  colors: MapHeaderActionColors;
  onLegendPress: () => void;
  onSearchPress: () => void;
};

export function MapHeaderActions({
  isSearchActive,
  isLegendActive,
  colors,
  onLegendPress,
  onSearchPress,
}: MapHeaderActionsProps) {
  return (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityLabel={
          isSearchActive ? "Close map search" : "Search map items"
        }
        accessibilityRole="button"
        onPress={onSearchPress}
        style={({ pressed }) => [
          styles.headerActionButton,
          {
            borderColor: colors.border,
            backgroundColor: pressed
              ? colors.pressedBackground
              : colors.background,
          },
          isSearchActive && styles.headerActionButtonActive,
        ]}
      >
        <Ionicons color={colors.text} name="search-outline" size={18} />
      </Pressable>

      <Pressable
        accessibilityLabel={
          isLegendActive ? "Close map legend" : "Open map legend"
        }
        accessibilityRole="button"
        onPress={onLegendPress}
        style={({ pressed }) => [
          styles.headerActionButton,
          {
            borderColor: colors.border,
            backgroundColor: pressed
              ? colors.pressedBackground
              : colors.background,
          },
          isLegendActive && styles.headerActionButtonActive,
        ]}
      >
        <Ionicons color={colors.text} name="book-outline" size={18} />
      </Pressable>

      <HeaderMoreMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 34,
    marginRight: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerActionButtonActive: {
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
});
