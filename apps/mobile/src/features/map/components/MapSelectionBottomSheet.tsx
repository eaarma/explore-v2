import { useCallback, useMemo } from "react";
import Animated from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapSelectionBottomSheetContent } from "@/src/features/map/components/MapSelectionBottomSheetContent";
import { useMapSelectionBottomSheet } from "@/src/features/map/hooks/useMapSelectionBottomSheet";
import type {
  MapBottomSheetSelection,
  MapBottomSheetState,
  MapSelectionCoordinates,
} from "@/src/features/map/types/mapBottomSheetTypes";
import { buildMapBottomSheetPresentation } from "@/src/features/map/utils/mapSelectionBottomSheetModel";
import {
  useMapSelectionBottomSheetTheme,
} from "@/src/features/map/utils/mapSelectionBottomSheetTheme";
import {
  showJourneyOptionsDialog,
  showLocationOptionsDialog,
} from "@/src/shared/utils/locationActions";

type MapSelectionBottomSheetProps = {
  selection: MapBottomSheetSelection | null;
  state: MapBottomSheetState;
  onChangeState: (state: MapBottomSheetState) => void;
  onToggleActive: (selection: MapBottomSheetSelection) => void;
  onOpenDetails: (selection: MapBottomSheetSelection) => void;
  onRequestClose: () => void;
  isActiveTogglePending?: boolean;
  userCoordinates?: MapSelectionCoordinates | null;
};

export type {
  MapBottomSheetSelection,
  MapBottomSheetState,
  MapSelectionCoordinates,
};

export function MapSelectionBottomSheet({
  selection,
  state,
  onChangeState,
  onToggleActive,
  onOpenDetails,
  onRequestClose,
  isActiveTogglePending = false,
  userCoordinates = null,
}: MapSelectionBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, styles } = useMapSelectionBottomSheetTheme();
  const {
    animatedBackdropStyle,
    animatedSheetStyle,
    expandedHeight,
    handleHeaderLayout,
    handlePanGesture,
    isHeaderDragging,
    summaryPanGesture,
  } = useMapSelectionBottomSheet({
    selection,
    state,
    onChangeState,
  });
  const presentation = useMemo(
    () =>
      selection
        ? buildMapBottomSheetPresentation(selection, userCoordinates)
        : null,
    [selection, userCoordinates],
  );

  const handleToggleActive = useCallback(() => {
    if (!selection) {
      return;
    }

    onToggleActive(selection);
  }, [onToggleActive, selection]);

  const handleOpenDetails = useCallback(() => {
    if (!selection) {
      return;
    }

    onOpenDetails(selection);
  }, [onOpenDetails, selection]);

  const handleOpenOptions = useCallback(() => {
    if (!selection) {
      return;
    }

    if (selection.kind === "location") {
      showLocationOptionsDialog(selection.item);
      return;
    }

    showJourneyOptionsDialog(selection.item);
  }, [selection]);

  if (!selection || !presentation) {
    return null;
  }

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.backdrop,
          {
            backgroundColor: colors.backdrop,
          },
          animatedBackdropStyle,
        ]}
      />

      <Animated.View
        pointerEvents={state === "hidden" ? "none" : "auto"}
        style={[
          styles.sheet,
          {
            borderColor: colors.sheetBorder,
            backgroundColor: colors.sheetBackground,
            height: expandedHeight,
            paddingBottom: Math.max(insets.bottom, 16),
          },
          animatedSheetStyle,
        ]}
      >
        <MapSelectionBottomSheetContent
          colors={colors}
          handlePanGesture={handlePanGesture}
          isActiveTogglePending={isActiveTogglePending}
          isExpanded={state === "expanded"}
          isHeaderDragging={isHeaderDragging}
          onHeaderLayout={handleHeaderLayout}
          onOpenDetails={handleOpenDetails}
          onOpenOptions={handleOpenOptions}
          onRequestClose={onRequestClose}
          onToggleActive={handleToggleActive}
          presentation={presentation}
          styles={styles}
          summaryPanGesture={summaryPanGesture}
        />
      </Animated.View>
    </>
  );
}
