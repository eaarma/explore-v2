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

export type MapToolbarColors = {
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

const TOOL_BUTTON_SIZE = 45;
const TOOL_BUTTON_GAP = 10;
const TOOL_PANEL_GAP = 12;

type MapToolbarPanelsProps = {
  activeToolPanel: ActiveToolPanel;
  chromeColors: MapToolbarColors;
  selectedMapStyle: MapStyleKey;
  overlayVisibility: Record<MapOverlayKey, boolean>;
  categoryVisibility: Record<string, boolean>;
  availableCategories: string[];
  hasEnabledOverlays: boolean;
  enabledCategoryCount: number;
  allCategoriesEnabled: boolean;
  onSelectMapStyle: (mapStyle: MapStyleKey) => void;
  onToggleOverlay: (overlayKey: MapOverlayKey) => void;
  onDisableAllOverlays: () => void;
  onToggleCategory: (category: string) => void;
  onDisableAllCategories: () => void;
  onEnableAllCategories: () => void;
};

export function MapToolbarPanels({
  activeToolPanel,
  chromeColors,
  selectedMapStyle,
  overlayVisibility,
  categoryVisibility,
  availableCategories,
  hasEnabledOverlays,
  enabledCategoryCount,
  allCategoriesEnabled,
  onSelectMapStyle,
  onToggleOverlay,
  onDisableAllOverlays,
  onToggleCategory,
  onDisableAllCategories,
  onEnableAllCategories,
}: MapToolbarPanelsProps) {
  if (activeToolPanel === "map-style") {
    return (
      <MapStylePanel
        chromeColors={chromeColors}
        selectedMapStyle={selectedMapStyle}
        onSelectMapStyle={onSelectMapStyle}
      />
    );
  }

  if (activeToolPanel === "overlay") {
    return (
      <MapOverlayPanel
        chromeColors={chromeColors}
        overlayVisibility={overlayVisibility}
        hasEnabledOverlays={hasEnabledOverlays}
        onToggleOverlay={onToggleOverlay}
        onDisableAllOverlays={onDisableAllOverlays}
      />
    );
  }

  if (activeToolPanel === "category-filter") {
    return (
      <MapCategoryFilterPanel
        chromeColors={chromeColors}
        categoryVisibility={categoryVisibility}
        availableCategories={availableCategories}
        enabledCategoryCount={enabledCategoryCount}
        allCategoriesEnabled={allCategoriesEnabled}
        onToggleCategory={onToggleCategory}
        onDisableAllCategories={onDisableAllCategories}
        onEnableAllCategories={onEnableAllCategories}
      />
    );
  }

  return null;
}

type MapToolbarButtonStackProps = {
  activeToolPanel: ActiveToolPanel;
  chromeColors: MapToolbarColors;
  hasEnabledOverlays: boolean;
  enabledOverlayCount: number;
  isCategoryFilterModified: boolean;
  enabledCategoryCount: number;
  shouldShowCompass: boolean;
  normalizedMapBearing: number;
  onCenterToUser: () => void | Promise<void>;
  onToggleToolPanel: (panel: Exclude<ActiveToolPanel, null>) => void;
  onResetMapOrientation: () => void;
};

export function MapToolbarButtonStack({
  activeToolPanel,
  chromeColors,
  hasEnabledOverlays,
  enabledOverlayCount,
  isCategoryFilterModified,
  enabledCategoryCount,
  shouldShowCompass,
  normalizedMapBearing,
  onCenterToUser,
  onToggleToolPanel,
  onResetMapOrientation,
}: MapToolbarButtonStackProps) {
  return (
    <View style={styles.toolButtonStack}>
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

      <ToolbarToolButton
        accessibilityLabel="Choose map type"
        active={activeToolPanel === "map-style"}
        chromeColors={chromeColors}
        iconName="layers-outline"
        onPress={() => onToggleToolPanel("map-style")}
      />

      <ToolbarToolButton
        accessibilityLabel="Toggle map overlays"
        active={activeToolPanel === "overlay" || hasEnabledOverlays}
        badgeCount={hasEnabledOverlays ? enabledOverlayCount : null}
        chromeColors={chromeColors}
        iconName="albums-outline"
        onPress={() => onToggleToolPanel("overlay")}
      />

      <ToolbarToolButton
        accessibilityLabel="Filter map categories"
        active={activeToolPanel === "category-filter" || isCategoryFilterModified}
        badgeCount={isCategoryFilterModified ? enabledCategoryCount : null}
        chromeColors={chromeColors}
        iconName="funnel-outline"
        onPress={() => onToggleToolPanel("category-filter")}
      />

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

function MapStylePanel({
  chromeColors,
  selectedMapStyle,
  onSelectMapStyle,
}: {
  chromeColors: MapToolbarColors;
  selectedMapStyle: MapStyleKey;
  onSelectMapStyle: (mapStyle: MapStyleKey) => void;
}) {
  return (
    <MapToolbarPanel panel="map-style" chromeColors={chromeColors}>
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
            <ToolbarOptionRow
              key={styleOption.key}
              chromeColors={chromeColors}
              iconName={styleOption.icon}
              isActive={isActive}
              label={styleOption.label}
              onPress={() => onSelectMapStyle(styleOption.key)}
            />
          );
        })}
      </View>
    </MapToolbarPanel>
  );
}

function MapOverlayPanel({
  chromeColors,
  overlayVisibility,
  hasEnabledOverlays,
  onToggleOverlay,
  onDisableAllOverlays,
}: {
  chromeColors: MapToolbarColors;
  overlayVisibility: Record<MapOverlayKey, boolean>;
  hasEnabledOverlays: boolean;
  onToggleOverlay: (overlayKey: MapOverlayKey) => void;
  onDisableAllOverlays: () => void;
}) {
  return (
    <MapToolbarPanel panel="overlay" chromeColors={chromeColors}>
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
          <PanelActionPill
            chromeColors={chromeColors}
            label="All off"
            onPress={onDisableAllOverlays}
          />
        ) : null}
      </View>

      <View style={styles.toolOptionList}>
        {MAP_OVERLAY_OPTIONS.map((overlayOption) => {
          const isActive = overlayVisibility[overlayOption.key];

          return (
            <ToolbarOptionRow
              key={overlayOption.key}
              chromeColors={chromeColors}
              iconName={overlayOption.icon}
              isActive={isActive}
              label={overlayOption.label}
              onPress={() => onToggleOverlay(overlayOption.key)}
              trailingIconName={
                isActive ? "checkmark-circle" : "ellipse-outline"
              }
            />
          );
        })}
      </View>
    </MapToolbarPanel>
  );
}

function MapCategoryFilterPanel({
  chromeColors,
  categoryVisibility,
  availableCategories,
  enabledCategoryCount,
  allCategoriesEnabled,
  onToggleCategory,
  onDisableAllCategories,
  onEnableAllCategories,
}: {
  chromeColors: MapToolbarColors;
  categoryVisibility: Record<string, boolean>;
  availableCategories: string[];
  enabledCategoryCount: number;
  allCategoriesEnabled: boolean;
  onToggleCategory: (category: string) => void;
  onDisableAllCategories: () => void;
  onEnableAllCategories: () => void;
}) {
  return (
    <MapToolbarPanel panel="category-filter" chromeColors={chromeColors}>
      <View style={styles.toolPanelHeader}>
        <Text
          style={[
            styles.toolPanelEyebrow,
            { color: chromeColors.toolPanelEyebrow },
          ]}
        >
          Categories
        </Text>
        <View style={styles.panelActionPillRow}>
          {enabledCategoryCount > 0 ? (
            <PanelActionPill
              chromeColors={chromeColors}
              label="All off"
              onPress={onDisableAllCategories}
            />
          ) : null}
          {!allCategoriesEnabled ? (
            <PanelActionPill
              chromeColors={chromeColors}
              label="All on"
              onPress={onEnableAllCategories}
            />
          ) : null}
        </View>
      </View>

      <Text
        style={[
          styles.toolPanelHint,
          { color: chromeColors.toolPanelHint },
        ]}
      >
        Showing {enabledCategoryCount} of {availableCategories.length} categories
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
    </MapToolbarPanel>
  );
}

function MapToolbarPanel({
  panel,
  chromeColors,
  children,
}: {
  panel: Exclude<ActiveToolPanel, null>;
  chromeColors: MapToolbarColors;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.toolPanelAnchor,
        { top: getToolPanelTop(panel) },
      ]}
    >
      <View
        style={[
          styles.toolPanel,
          {
            borderColor: chromeColors.toolPanelBorder,
            backgroundColor: chromeColors.toolPanelBackground,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function ToolbarOptionRow({
  chromeColors,
  iconName,
  isActive,
  label,
  onPress,
  trailingIconName,
}: {
  chromeColors: MapToolbarColors;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  isActive: boolean;
  label: string;
  onPress: () => void;
  trailingIconName?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
        name={iconName}
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
        {label}
      </Text>
      {trailingIconName ? (
        <Ionicons
          color={
            isActive
              ? chromeColors.toolOptionTextActive
              : chromeColors.toolPanelHint
          }
          name={trailingIconName}
          size={18}
          style={styles.optionTrailingIcon}
        />
      ) : null}
    </Pressable>
  );
}

function PanelActionPill({
  chromeColors,
  label,
  onPress,
}: {
  chromeColors: MapToolbarColors;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.panelActionPill,
        {
          backgroundColor: chromeColors.panelActionPillBackground,
        },
        pressed && {
          backgroundColor: chromeColors.panelActionPillPressedBackground,
        },
      ]}
    >
      <Text
        style={[
          styles.panelActionPillText,
          { color: chromeColors.panelActionPillText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ToolbarToolButton({
  accessibilityLabel,
  active,
  badgeCount = null,
  chromeColors,
  iconName,
  onPress,
}: {
  accessibilityLabel: string;
  active: boolean;
  badgeCount?: number | null;
  chromeColors: MapToolbarColors;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolButton,
        {
          borderColor: active
            ? chromeColors.toolButtonActiveBorder
            : chromeColors.toolButtonBorder,
          backgroundColor: active
            ? chromeColors.toolButtonActiveBackground
            : chromeColors.toolButtonBackground,
        },
        pressed && styles.toolButtonPressed,
      ]}
    >
      <Ionicons
        color={active ? chromeColors.toolButtonActiveIcon : chromeColors.toolButtonIcon}
        name={iconName}
        size={22}
      />
      {badgeCount ? (
        <View
          style={[
            styles.toolButtonBadge,
            {
              backgroundColor: chromeColors.badgeBackground,
              borderColor: chromeColors.badgeBorder,
            },
          ]}
        >
          <Text style={styles.toolButtonBadgeText}>{badgeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolButtonStack: {
    gap: TOOL_BUTTON_GAP,
    alignItems: "flex-end",
  },
  toolButton: {
    width: TOOL_BUTTON_SIZE,
    height: TOOL_BUTTON_SIZE,
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
  toolPanelAnchor: {
    position: "absolute",
    right: TOOL_BUTTON_SIZE + TOOL_PANEL_GAP,
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
  panelActionPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
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

function getToolPanelTop(panel: Exclude<ActiveToolPanel, null>) {
  switch (panel) {
    case "map-style":
      return TOOL_BUTTON_SIZE + TOOL_BUTTON_GAP;
    case "overlay":
      return (TOOL_BUTTON_SIZE + TOOL_BUTTON_GAP) * 2;
    case "category-filter":
      return (TOOL_BUTTON_SIZE + TOOL_BUTTON_GAP) * 3;
  }
}
