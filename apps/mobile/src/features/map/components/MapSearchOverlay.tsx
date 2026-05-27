import type { RefObject } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { MapSearchResult } from "@/src/features/map/utils/mapSearch";

type MapSearchOverlayColors = {
  toolButtonActiveBorder: string;
  toolButtonBackground: string;
  toolButtonIcon: string;
  toolOptionBackground: string;
  toolOptionBorder: string;
  toolOptionPressedBackground: string;
  toolOptionText: string;
  panelActionPillBackground: string;
  panelActionPillPressedBackground: string;
  panelActionPillText: string;
  searchCloseIcon: string;
  searchInputBackground: string;
  searchInputBorder: string;
  searchInputPlaceholder: string;
  searchInputText: string;
  searchResultKindBackground: string;
  searchResultKindText: string;
  searchResultMeta: string;
  toolPanelHint: string;
};

type MapSearchOverlayProps = {
  visible: boolean;
  searchInputRef: RefObject<TextInput | null>;
  searchQuery: string;
  isDark: boolean;
  colors: MapSearchOverlayColors;
  results: MapSearchResult[];
  onChangeSearchQuery: (value: string) => void;
  onSubmitSearch: () => void;
  onClose: () => void;
  onClearSearch: () => void;
  onSelectResult: (result: MapSearchResult) => void;
};

export function MapSearchOverlay({
  visible,
  searchInputRef,
  searchQuery,
  isDark,
  colors,
  results,
  onChangeSearchQuery,
  onSubmitSearch,
  onClose,
  onClearSearch,
  onSelectResult,
}: MapSearchOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.searchOverlayCard,
        {
          top: 30,
          borderColor: colors.toolButtonActiveBorder,
          backgroundColor: colors.toolButtonBackground,
        },
      ]}
    >
      <View
        style={[
          styles.searchInputRow,
          {
            borderColor: colors.searchInputBorder,
            backgroundColor: colors.searchInputBackground,
          },
        ]}
      >
        <Ionicons color={colors.toolButtonIcon} name="search-outline" size={20} />
        <TextInput
          ref={searchInputRef}
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          onSubmitEditing={onSubmitSearch}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardAppearance={isDark ? "dark" : "light"}
          placeholder="Search visible places and journeys"
          placeholderTextColor={colors.searchInputPlaceholder}
          returnKeyType="search"
          style={[
            styles.searchInput,
            {
              color: colors.searchInputText,
            },
          ]}
        />
        <Pressable
          accessibilityLabel="Close map search"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.searchCloseButton}
        >
          <Ionicons color={colors.searchCloseIcon} name="close-outline" size={20} />
        </Pressable>
      </View>

      {searchQuery.trim().length > 0 ? (
        results.length > 0 ? (
          <View style={styles.searchResultList}>
            {results.map((result) => (
              <Pressable
                key={result.key}
                accessibilityRole="button"
                onPress={() => onSelectResult(result)}
                style={({ pressed }) => [
                  styles.searchResultButton,
                  {
                    borderColor: colors.toolOptionBorder,
                    backgroundColor: pressed
                      ? colors.toolOptionPressedBackground
                      : colors.toolOptionBackground,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.searchResultTitle,
                    { color: colors.toolOptionText },
                  ]}
                >
                  {result.title}
                </Text>
                <View style={styles.searchResultMetaRow}>
                  <View
                    style={[
                      styles.searchResultKindPill,
                      {
                        backgroundColor: colors.searchResultKindBackground,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.searchResultKindText,
                        { color: colors.searchResultKindText },
                      ]}
                    >
                      {result.kind === "location" ? "Location" : "Journey"}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.searchResultMetaText,
                      { color: colors.searchResultMeta },
                    ]}
                  >
                    {result.county} | {result.category}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.searchEmptyState}>
            <Text style={[styles.searchHintText, { color: colors.toolPanelHint }]}>
              No visible map items match the current search.
            </Text>
            <Pressable
              accessibilityLabel="Clear map search"
              accessibilityRole="button"
              onPress={onClearSearch}
              style={({ pressed }) => [
                styles.panelActionPill,
                {
                  backgroundColor: colors.panelActionPillBackground,
                },
                pressed && {
                  backgroundColor: colors.panelActionPillPressedBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.panelActionPillText,
                  { color: colors.panelActionPillText },
                ]}
              >
                Clear
              </Text>
            </Pressable>
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchOverlayCard: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: "600",
  },
  searchCloseButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  searchHintText: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchResultList: {
    gap: 8,
  },
  searchResultButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchResultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchResultKindPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchResultKindText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  searchResultMetaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  searchEmptyState: {
    gap: 10,
    alignItems: "flex-start",
  },
  panelActionPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  panelActionPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
