import { View } from "react-native";

import {
  type MapToolbarColors,
  MapToolbarButtonStack,
  MapToolbarPanels,
} from "@/src/features/map/components/MapToolbarParts";
import {
  type MapOverlayKey,
  type MapStyleKey,
} from "@/src/features/map/mapConfig";
import type { ActiveToolPanel } from "@/src/features/map/types/mapUiTypes";

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
  onDisableAllCategories: () => void;
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
  onDisableAllCategories,
  onEnableAllCategories,
  onResetMapOrientation,
}: MapToolbarProps) {
  return (
    <View style={styles.tools}>
      <MapToolbarPanels
        activeToolPanel={activeToolPanel}
        chromeColors={chromeColors}
        selectedMapStyle={selectedMapStyle}
        overlayVisibility={overlayVisibility}
        categoryVisibility={categoryVisibility}
        availableCategories={availableCategories}
        hasEnabledOverlays={hasEnabledOverlays}
        enabledCategoryCount={enabledCategoryCount}
        allCategoriesEnabled={allCategoriesEnabled}
        onSelectMapStyle={onSelectMapStyle}
        onToggleOverlay={onToggleOverlay}
        onDisableAllOverlays={onDisableAllOverlays}
        onToggleCategory={onToggleCategory}
        onDisableAllCategories={onDisableAllCategories}
        onEnableAllCategories={onEnableAllCategories}
      />

      <MapToolbarButtonStack
        activeToolPanel={activeToolPanel}
        chromeColors={chromeColors}
        hasEnabledOverlays={hasEnabledOverlays}
        enabledOverlayCount={enabledOverlayCount}
        isCategoryFilterModified={isCategoryFilterModified}
        enabledCategoryCount={enabledCategoryCount}
        shouldShowCompass={shouldShowCompass}
        normalizedMapBearing={normalizedMapBearing}
        onCenterToUser={onCenterToUser}
        onToggleToolPanel={onToggleToolPanel}
        onResetMapOrientation={onResetMapOrientation}
      />
    </View>
  );
}

const styles = {
  tools: {
    position: "absolute",
    right: 16,
    top: 40,
  },
} as const;
