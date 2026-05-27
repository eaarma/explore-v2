import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM,
  DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM,
  MAP_OVERLAY_OPTIONS,
  MAP_STYLE_OPTIONS,
  type MapOverlayKey,
  type MapStyleKey,
} from "@/src/features/map/mapConfig";
import type { ActiveToolPanel } from "@/src/features/map/types/mapUiTypes";
import { isCategoryVisible } from "@/src/features/map/utils/mapFeatureCollection";

type MapToolbarColors = {
  badgeBackground: string;
  badgeBorder: string;
  compassArrow: string;
  compassNorth: string;
  filterChipActiveBackground: string;
  filterChipActiveBorder: string;
  filterChipBackground: string;
  filterChipBorder: string;
  filterChipPressedBackground: string;
  filterChipText: string;
  filterChipTextActive: string;
  panelActionPillBackground: string;
  panelActionPillPressedBackground: string;
  panelActionPillText: string;
  toolButtonActiveBackground: string;
  toolButtonActiveBorder: string;
  toolButtonActiveIcon: string;
  toolButtonBackground: string;
  toolButtonBorder: string;
  toolButtonIcon: string;
  toolOptionActiveBackground: string;
  toolOptionActiveBorder: string;
  toolOptionBackground: string;
  toolOptionBorder: string;
  toolOptionPressedBackground: string;
  toolOptionText: string;
  toolOptionTextActive: string;
  toolPanelBackground: string;
  toolPanelBorder: string;
  toolPanelEyebrow: string;
  toolPanelHint: string;
};

type MapToolbarProps = {
  activeToolPanel: ActiveToolPanel;
  chromeColors: MapToolbarColors;
  selectedMapStyle: MapStyleKey;
  overlayVisibility: Record<MapOverlayKey, boolean>;
  categoryVisibility: Record<string, boolean>;
  availableCategories: string[];
  hasEnabledOverlays: boolean;
  enabledOverlayCount: number;
  isCategoryFilterModified: boolean;
  enabledCategoryCount: number;
  allCategoriesEnabled: boolean;
  shouldShowCompass: boolean;
  normalizedMapBearing: number;
  onCenterToUser: () => void | Promise<void>;
  onToggleToolPanel: (panel: Exclude<ActiveToolPanel, null>) => void;
  onSelectMapStyle: (mapStyle: MapStyleKey) => void;
  onToggleOverlay: (overlayKey: MapOverlayKey) => void;
  onDisableAllOverlays: () => void;
  onToggleCategory: (category: string) => void;
  onEnableAllCategories: () => void;
  onResetMapOrientation: () => void;
};

export function MapToolbar({
  activeToolPanel,
  chromeColors,
  selectedMapStyle,
  overlayVisibility,
  categoryVisibility,
  availableCategories,
  hasEnabledOverlays,
  enabledOverlayCount,
  isCategoryFilterModified,
  enabledCategoryCount,
  allCategoriesEnabled,
  shouldShowCompass,
  normalizedMapBearing,
  onCenterToUser,
  onToggleToolPanel,
  onSelectMapStyle,
  onToggleOverlay,
  onDisableAllOverlays,
  onToggleCategory,
  onEnableAllCategories,
  onResetMapOrientation,
}: MapToolbarProps) {
  return (
    <View style={styles.tools}>
      <Pressable
        accessibilityLabel="Center map on your location"
        accessibilityRole="button"
        onPress={onCenterToUser}
        style={({ pressed }) => [
          styles.toolButton,
          {
            borderColor: chromeColors.toolButtonBorder,
            backgroundColor: chromeColors.toolButtonBackground,
          },
          pressed && styles.toolButtonPressed,
        ]}
      >
        <MaterialCommunityIcons
          color={chromeColors.toolButtonIcon}
          name="crosshairs-gps"
          size={22}
        />
      </Pressable>

      <Pressable
        accessibilityLabel="Choose map type"
        accessibilityRole="button"
        onPress={() => onToggleToolPanel("map-style")}
        style={({ pressed }) => [
          styles.toolButton,
          {
            borderColor:
              activeToolPanel === "map-style"
                ? chromeColors.toolButtonActiveBorder
                : chromeColors.toolButtonBorder,
            backgroundColor:
              activeToolPanel === "map-style"
                ? chromeColors.toolButtonActiveBackground
                : chromeColors.toolButtonBackground,
          },
          pressed && styles.toolButtonPressed,
        ]}
      >
        <Ionicons
          color={
            activeToolPanel === "map-style"
              ? chromeColors.toolButtonActiveIcon
              : chromeColors.toolButtonIcon
          }
          name="layers-outline"
          size={22}
        />
      </Pressable>

      <Pressable
        accessibilityLabel="Toggle map overlays"
        accessibilityRole="button"
        onPress={() => onToggleToolPanel("overlay")}
        style={({ pressed }) => [
          styles.toolButton,
          {
            borderColor:
              activeToolPanel === "overlay" || hasEnabledOverlays
                ? chromeColors.toolButtonActiveBorder
                : chromeColors.toolButtonBorder,
            backgroundColor:
              activeToolPanel === "overlay" || hasEnabledOverlays
                ? chromeColors.toolButtonActiveBackground
                : chromeColors.toolButtonBackground,
          },
          pressed && styles.toolButtonPressed,
        ]}
      >
        <Ionicons
          color={
            activeToolPanel === "overlay" || hasEnabledOverlays
              ? chromeColors.toolButtonActiveIcon
              : chromeColors.toolButtonIcon
          }
          name="albums-outline"
          size={22}
        />
        {hasEnabledOverlays ? (
          <View
            style={[
              styles.toolButtonBadge,
              {
                backgroundColor: chromeColors.badgeBackground,
                borderColor: chromeColors.badgeBorder,
              },
            ]}
          >
            <Text style={styles.toolButtonBadgeText}>{enabledOverlayCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityLabel="Filter map categories"
        accessibilityRole="button"
        onPress={() => onToggleToolPanel("category-filter")}
        style={({ pressed }) => [
          styles.toolButton,
          {
            borderColor:
              activeToolPanel === "category-filter" || isCategoryFilterModified
                ? chromeColors.toolButtonActiveBorder
                : chromeColors.toolButtonBorder,
            backgroundColor:
              activeToolPanel === "category-filter" || isCategoryFilterModified
                ? chromeColors.toolButtonActiveBackground
                : chromeColors.toolButtonBackground,
          },
          pressed && styles.toolButtonPressed,
        ]}
      >
        <Ionicons
          color={
            activeToolPanel === "category-filter" || isCategoryFilterModified
              ? chromeColors.toolButtonActiveIcon
              : chromeColors.toolButtonIcon
          }
          name="funnel-outline"
          size={22}
        />
        {isCategoryFilterModified ? (
          <View
            style={[
              styles.toolButtonBadge,
              {
                backgroundColor: chromeColors.badgeBackground,
                borderColor: chromeColors.badgeBorder,
              },
            ]}
          >
            <Text style={styles.toolButtonBadgeText}>{enabledCategoryCount}</Text>
          </View>
        ) : null}
      </Pressable>

      {activeToolPanel === "map-style" ? (
        <View
          style={[
            styles.toolPanel,
            {
              borderColor: chromeColors.toolPanelBorder,
              backgroundColor: chromeColors.toolPanelBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.toolPanelEyebrow,
              { color: chromeColors.toolPanelEyebrow },
            ]}
          >
            Map Type
          </Text>
          <Text
            style={[
              styles.toolPanelHint,
              { color: chromeColors.toolPanelHint },
            ]}
          >
            Road stays available offline between zooms{" "}
            {DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM} and{" "}
            {DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM}.
          </Text>

          <View style={styles.toolOptionList}>
            {MAP_STYLE_OPTIONS.map((styleOption) => {
              const isActive = selectedMapStyle === styleOption.key;

              return (
                <Pressable
                  key={styleOption.key}
                  accessibilityRole="button"
                  onPress={() => onSelectMapStyle(styleOption.key)}
                  style={({ pressed }) => [
                    styles.toolOption,
                    {
                      borderColor: isActive
                        ? chromeColors.toolOptionActiveBorder
                        : chromeColors.toolOptionBorder,
                      backgroundColor: isActive
                        ? chromeColors.toolOptionActiveBackground
                        : chromeColors.toolOptionBackground,
                    },
                    pressed && {
                      backgroundColor: chromeColors.toolOptionPressedBackground,
                    },
                  ]}
                >
                  <Ionicons
                    color={
                      isActive
                        ? chromeColors.toolOptionTextActive
                        : chromeColors.toolPanelHint
                    }
                    name={styleOption.icon}
                    size={18}
                  />
                  <Text
                    style={[
                      styles.toolOptionText,
                      {
                        color: isActive
                          ? chromeColors.toolOptionTextActive
                          : chromeColors.toolOptionText,
                      },
                    ]}
                  >
                    {styleOption.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {activeToolPanel === "overlay" ? (
        <View
          style={[
            styles.toolPanel,
            {
              borderColor: chromeColors.toolPanelBorder,
              backgroundColor: chromeColors.toolPanelBackground,
            },
          ]}
        >
          <View style={styles.toolPanelHeader}>
            <Text
              style={[
                styles.toolPanelEyebrow,
                { color: chromeColors.toolPanelEyebrow },
              ]}
            >
              Overlay
            </Text>
            {hasEnabledOverlays ? (
              <Pressable
                accessibilityRole="button"
                onPress={onDisableAllOverlays}
                style={({ pressed }) => [
                  styles.panelActionPill,
                  {
                    backgroundColor: chromeColors.panelActionPillBackground,
                  },
                  pressed && {
                    backgroundColor:
                      chromeColors.panelActionPillPressedBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.panelActionPillText,
                    { color: chromeColors.panelActionPillText },
                  ]}
                >
                  All off
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.toolOptionList}>
            {MAP_OVERLAY_OPTIONS.map((overlayOption) => {
              const isActive = overlayVisibility[overlayOption.key];

              return (
                <Pressable
                  key={overlayOption.key}
                  accessibilityRole="button"
                  onPress={() => onToggleOverlay(overlayOption.key)}
                  style={({ pressed }) => [
                    styles.toolOption,
                    {
                      borderColor: isActive
                        ? chromeColors.toolOptionActiveBorder
                        : chromeColors.toolOptionBorder,
                      backgroundColor: isActive
                        ? chromeColors.toolOptionActiveBackground
                        : chromeColors.toolOptionBackground,
                    },
                    pressed && {
                      backgroundColor: chromeColors.toolOptionPressedBackground,
                    },
                  ]}
                >
                  <Ionicons
                    color={
                      isActive
                        ? chromeColors.toolOptionTextActive
                        : chromeColors.toolPanelHint
                    }
                    name={overlayOption.icon}
                    size={18}
                  />
                  <Text
                    style={[
                      styles.toolOptionText,
                      {
                        color: isActive
                          ? chromeColors.toolOptionTextActive
                          : chromeColors.toolOptionText,
                      },
                    ]}
                  >
                    {overlayOption.label}
                  </Text>
                  <Ionicons
                    color={
                      isActive
                        ? chromeColors.toolOptionTextActive
                        : chromeColors.toolPanelHint
                    }
                    name={isActive ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    style={styles.optionTrailingIcon}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {activeToolPanel === "category-filter" ? (
        <View
          style={[
            styles.toolPanel,
            {
              borderColor: chromeColors.toolPanelBorder,
              backgroundColor: chromeColors.toolPanelBackground,
            },
          ]}
        >
          <View style={styles.toolPanelHeader}>
            <Text
              style={[
                styles.toolPanelEyebrow,
                { color: chromeColors.toolPanelEyebrow },
              ]}
            >
              Categories
            </Text>
            {!allCategoriesEnabled ? (
              <Pressable
                accessibilityRole="button"
                onPress={onEnableAllCategories}
                style={({ pressed }) => [
                  styles.panelActionPill,
                  {
                    backgroundColor: chromeColors.panelActionPillBackground,
                  },
                  pressed && {
                    backgroundColor:
                      chromeColors.panelActionPillPressedBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.panelActionPillText,
                    { color: chromeColors.panelActionPillText },
                  ]}
                >
                  All on
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Text
            style={[
              styles.toolPanelHint,
              { color: chromeColors.toolPanelHint },
            ]}
          >
            Showing {enabledCategoryCount} of {availableCategories.length}{" "}
            categories
          </Text>

          <View style={styles.filterChipWrap}>
            {availableCategories.map((category) => {
              const isActive = isCategoryVisible(categoryVisibility, category);

              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  onPress={() => onToggleCategory(category)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      borderColor: isActive
                        ? chromeColors.filterChipActiveBorder
                        : chromeColors.filterChipBorder,
                      backgroundColor: isActive
                        ? chromeColors.filterChipActiveBackground
                        : chromeColors.filterChipBackground,
                    },
                    pressed && {
                      backgroundColor: chromeColors.filterChipPressedBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isActive
                          ? chromeColors.filterChipTextActive
                          : chromeColors.filterChipText,
                      },
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {shouldShowCompass ? (
        <Pressable
          accessibilityLabel="Reset map orientation to north"
          accessibilityRole="button"
          onPress={onResetMapOrientation}
          style={({ pressed }) => [
            styles.toolButton,
            styles.compassToolButton,
            {
              borderColor: chromeColors.toolButtonBorder,
              backgroundColor: chromeColors.toolButtonBackground,
            },
            pressed && styles.toolButtonPressed,
          ]}
        >
          <View style={styles.compassContent}>
            <View
              style={[
                styles.compassArrowWrap,
                {
                  transform: [{ rotate: `${-normalizedMapBearing}deg` }],
                },
              ]}
            >
              <Text
                style={[
                  styles.compassNorthLabel,
                  { color: chromeColors.compassNorth },
                ]}
              >
                N
              </Text>
              <MaterialCommunityIcons
                color={chromeColors.compassArrow}
                name="navigation"
                size={24}
                style={styles.compassArrowIcon}
              />
            </View>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tools: {
    position: "absolute",
    right: 16,
    top: 40,
    gap: 10,
    alignItems: "flex-end",
  },
  toolButton: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },
  toolButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  toolButtonBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
  },
  toolButtonBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  toolPanel: {
    width: 236,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  toolPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toolPanelEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  toolPanelHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  toolOptionList: {
    gap: 10,
  },
  toolOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toolOptionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionTrailingIcon: {
    marginLeft: "auto",
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
  filterChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  compassToolButton: {
    overflow: "hidden",
  },
  compassContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  compassNorthLabel: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 10,
    letterSpacing: 0.4,
    marginBottom: -1,
  },
  compassArrowWrap: {
    width: 24,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  compassArrowIcon: {
    marginTop: 1,
  },
});
