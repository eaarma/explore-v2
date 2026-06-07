import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  getJourneyCompletionStatusLabel,
  getLocationVisitStatusLabel,
} from "@/src/features/discoveries/utils/discoveryPresentation";
import { normalizeCategory as normalizeJourneyCategory } from "@/src/features/journeys/components/journeysSectionShared";
import { normalizeCategory as normalizeLocationCategory } from "@/src/features/locations/components/locationsSectionShared";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  ACTIVE_STATE_ACCENT,
  getActiveStateColors,
} from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  showJourneyOptionsDialog,
  showLocationOptionsDialog,
} from "@/src/shared/utils/locationActions";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type MapBottomSheetState = "hidden" | "collapsed" | "expanded";

export type MapBottomSheetSelection =
  | {
      kind: "location";
      item: Location;
    }
  | {
      kind: "journey";
      item: Journey;
    };

type MapSelectionBottomSheetProps = {
  selection: MapBottomSheetSelection | null;
  state: MapBottomSheetState;
  onChangeState: (state: MapBottomSheetState) => void;
  onToggleActive: (selection: MapBottomSheetSelection) => void;
  onOpenDetails: (selection: MapBottomSheetSelection) => void;
  onRequestClose: () => void;
  isActiveTogglePending?: boolean;
};

const DEFAULT_COLLAPSED_HEIGHT = 110;

export function MapSelectionBottomSheet({
  selection,
  state,
  onChangeState,
  onToggleActive,
  onOpenDetails,
  onRequestClose,
  isActiveTogglePending = false,
}: MapSelectionBottomSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const activeStateColors = useMemo(
    () => getActiveStateColors(isDark),
    [isDark],
  );
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_COLLAPSED_HEIGHT);
  const expandedHeight = Math.round(
    Math.min(Math.max(windowHeight * 0.58, 360), windowHeight - 92),
  );
  const collapsedHeight = Math.min(headerHeight, expandedHeight);
  const collapsedOffset = Math.max(0, expandedHeight - collapsedHeight);
  const hiddenOffset = expandedHeight + 36;
  const translateY = useRef(new Animated.Value(hiddenOffset)).current;
  const currentTranslateYRef = useRef(hiddenOffset);
  const dragStartOffsetRef = useRef(hiddenOffset);
  const isDraggingRef = useRef(false);

  const backdropOpacity = useMemo(
    () =>
      translateY.interpolate({
        inputRange: [0, collapsedOffset, hiddenOffset],
        outputRange: [0.28, 0.12, 0],
        extrapolate: "clamp",
      }),
    [collapsedOffset, hiddenOffset, translateY],
  );

  const animateToState = useCallback(
    (nextState: MapBottomSheetState) => {
      Animated.spring(translateY, {
        toValue: getTranslateYForState(
          nextState,
          collapsedOffset,
          hiddenOffset,
        ),
        damping: 24,
        mass: 0.95,
        stiffness: 260,
        useNativeDriver: true,
      }).start();
    },
    [collapsedOffset, hiddenOffset, translateY],
  );

  useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      currentTranslateYRef.current = value;
    });

    return () => {
      translateY.removeListener(listenerId);
    };
  }, [translateY]);

  useEffect(() => {
    if (!selection) {
      translateY.setValue(hiddenOffset);
      currentTranslateYRef.current = hiddenOffset;
      return;
    }

    if (isDraggingRef.current) {
      return;
    }

    animateToState(state);
  }, [animateToState, hiddenOffset, selection, state, translateY]);

  if (!selection) {
    return null;
  }

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
      Math.abs(gestureState.dy) > 4,
    onPanResponderGrant: () => {
      isDraggingRef.current = true;
      dragStartOffsetRef.current = currentTranslateYRef.current;
      translateY.stopAnimation((value) => {
        dragStartOffsetRef.current = value;
        currentTranslateYRef.current = value;
      });
    },
    onPanResponderMove: (_, gestureState) => {
      const nextTranslateY = clamp(
        dragStartOffsetRef.current + gestureState.dy,
        0,
        collapsedOffset,
      );

      translateY.setValue(nextTranslateY);
    },
    onPanResponderRelease: (_, gestureState) => {
      finishDragGesture(gestureState.dy, gestureState.vy);
    },
    onPanResponderTerminate: (_, gestureState) => {
      finishDragGesture(gestureState.dy, gestureState.vy);
    },
  });

  const categoryLabel =
    selection.kind === "location"
      ? normalizeLocationCategory(selection.item.category)
      : normalizeJourneyCategory(selection.item.category);
  const title = getTitle(selection);
  const summaryLabel = `${capitalize(selection.kind)} | ${categoryLabel}`;
  const isExpanded = state === "expanded";
  const metricLabels = getMetricLabels(selection, categoryLabel);
  const description = getDescription(selection);
  const isActive = selection.item.active === true;
  const activeToggleLabel = isActive
    ? `Remove ${selection.kind} from active items`
    : `Add ${selection.kind} to active items`;
  const sheetColors = isDark
    ? {
        backdrop: "#020617",
        sheetBorder: "#1E293B",
        sheetBackground: "#0F172A",
        headerBorder: "#1E293B",
        handle: "#334155",
        activeToggleBorder: "#334155",
        activeToggleBackground: "#111827",
        activeToggleActiveBorder: "#FACC15",
        activeToggleActiveBackground: "#422006",
        activeToggleIcon: "#CBD5E1",
        activeToggleActiveIcon: "#FDE68A",
        summaryLabel: ACTIVE_STATE_ACCENT,
        title: "#F8FAFC",
        metricChipBackground: "#111827",
        metricChipText: "#E2E8F0",
        sectionLabel: "#94A3B8",
        description: "#CBD5E1",
        primaryButtonBackground: activeStateColors.buttonBackground,
        primaryButtonText: activeStateColors.text,
        secondaryButtonBorder: "#334155",
        secondaryButtonBackground: "#111827",
        secondaryButtonText: "#E2E8F0",
      }
    : {
        backdrop: "#020617",
        sheetBorder: "#D6D3D1",
        sheetBackground: "#FFFCF7",
        headerBorder: "#EEE7DB",
        handle: "#CBD5E1",
        activeToggleBorder: "#D7E0EA",
        activeToggleBackground: "#FFFFFF",
        activeToggleActiveBorder: "#FACC15",
        activeToggleActiveBackground: "#FEF3C7",
        activeToggleIcon: "#334155",
        activeToggleActiveIcon: "#92400E",
        summaryLabel: ACTIVE_STATE_ACCENT,
        title: "#0F172A",
        metricChipBackground: "#F1F5F9",
        metricChipText: "#334155",
        sectionLabel: "#475569",
        description: "#334155",
        primaryButtonBackground: activeStateColors.buttonBackground,
        primaryButtonText: activeStateColors.text,
        secondaryButtonBorder: "#CBD5E1",
        secondaryButtonBackground: "#FFFFFF",
        secondaryButtonText: "#334155",
      };

  return (
    <>
      <Animated.View
        pointerEvents={state === "hidden" ? "none" : "auto"}
        style={[
          StyleSheet.absoluteFillObject,
          styles.backdrop,
          {
            backgroundColor: sheetColors.backdrop,
            opacity: backdropOpacity,
          },
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={onRequestClose} />
      </Animated.View>

      <Animated.View
        pointerEvents={state === "hidden" ? "none" : "auto"}
        style={[
          styles.sheet,
          {
            borderColor: sheetColors.sheetBorder,
            backgroundColor: sheetColors.sheetBackground,
            height: expandedHeight,
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          onLayout={handleHeaderLayout}
          style={[
            styles.header,
            {
              borderBottomColor: sheetColors.headerBorder,
            },
          ]}
        >
          <View style={styles.handleButton} {...panResponder.panHandlers}>
            <View
              style={[styles.handle, { backgroundColor: sheetColors.handle }]}
            />
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryDragArea} {...panResponder.panHandlers}>
              <View style={styles.summaryCopy}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: sheetColors.summaryLabel },
                  ]}
                >
                  {summaryLabel}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.title, { color: sheetColors.title }]}
                >
                  {title}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel={activeToggleLabel}
              accessibilityRole="button"
              disabled={isActiveTogglePending}
              hitSlop={6}
              onStartShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onPressIn={(event) => {
                event.stopPropagation();
                onToggleActive(selection);
              }}
              style={({ pressed }) => [
                styles.activeToggleButton,
                {
                  borderColor: isActive
                    ? sheetColors.activeToggleActiveBorder
                    : sheetColors.activeToggleBorder,
                  backgroundColor: isActive
                    ? sheetColors.activeToggleActiveBackground
                    : sheetColors.activeToggleBackground,
                },
                pressed && styles.activeToggleButtonPressed,
                isActiveTogglePending && styles.activeToggleButtonDisabled,
              ]}
            >
              <Ionicons
                color={
                  isActive
                    ? sheetColors.activeToggleActiveIcon
                    : sheetColors.activeToggleIcon
                }
                name={isActive ? "remove" : "add"}
                size={24}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.expandedContent}
          scrollEnabled={isExpanded}
          showsVerticalScrollIndicator={false}
          style={styles.expandedScroll}
        >
          <View style={styles.metricRow}>
            {metricLabels.map((metricLabel) => (
              <View
                key={metricLabel}
                style={[
                  styles.metricChip,
                  { backgroundColor: sheetColors.metricChipBackground },
                ]}
              >
                <Text
                  style={[
                    styles.metricChipText,
                    { color: sheetColors.metricChipText },
                  ]}
                >
                  {metricLabel}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.detailBlock}>
            <Text
              style={[styles.sectionLabel, { color: sheetColors.sectionLabel }]}
            >
              Overview
            </Text>
            <Text
              style={[styles.description, { color: sheetColors.description }]}
            >
              {description}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => onOpenDetails(selection)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: sheetColors.primaryButtonBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { color: sheetColors.primaryButtonText },
                ]}
              >
                View details
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel={
                selection.kind === "location"
                  ? "More location actions"
                  : "More journey actions"
              }
              accessibilityRole="button"
              onPress={() => {
                if (selection.kind === "location") {
                  showLocationOptionsDialog(selection.item);
                  return;
                }

                showJourneyOptionsDialog(selection.item);
              }}
              style={[
                styles.actionButton,
                styles.secondaryActionButton,
                styles.actionIconButton,
                {
                  borderColor: sheetColors.secondaryButtonBorder,
                  backgroundColor: sheetColors.secondaryButtonBackground,
                },
              ]}
            >
              <Ionicons
                color={sheetColors.secondaryButtonText}
                name="ellipsis-horizontal"
                size={20}
              />
            </Pressable>

            <Pressable
              onPress={onRequestClose}
              style={[
                styles.actionButton,
                styles.secondaryActionButton,
                {
                  borderColor: sheetColors.secondaryButtonBorder,
                  backgroundColor: sheetColors.secondaryButtonBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  styles.secondaryActionButtonText,
                  { color: sheetColors.secondaryButtonText },
                ]}
              >
                Hide
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );

  function handleHeaderLayout(event: LayoutChangeEvent) {
    const nextHeaderHeight = Math.ceil(event.nativeEvent.layout.height);

    setHeaderHeight((currentHeaderHeight) =>
      currentHeaderHeight === nextHeaderHeight
        ? currentHeaderHeight
        : nextHeaderHeight,
    );
  }

  function finishDragGesture(dy: number, vy: number) {
    isDraggingRef.current = false;

    const upwardDragPassed = dy <= -20 || vy <= -0.25;
    const downwardDragPassed = dy >= 20 || vy >= 0.25;
    const midpoint = collapsedOffset / 2;
    const nextState = upwardDragPassed
      ? "expanded"
      : downwardDragPassed
        ? "collapsed"
        : currentTranslateYRef.current <= midpoint
          ? "expanded"
          : "collapsed";

    animateToState(nextState);

    if (nextState !== state) {
      onChangeState(nextState);
    }
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTranslateYForState(
  state: MapBottomSheetState,
  collapsedOffset: number,
  hiddenOffset: number,
) {
  if (state === "expanded") {
    return 0;
  }

  if (state === "collapsed") {
    return collapsedOffset;
  }

  return hiddenOffset;
}

function getTitle(selection: MapBottomSheetSelection) {
  const trimmedTitle = selection.item.title.trim();

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return selection.kind === "location"
    ? "Untitled location"
    : "Untitled journey";
}

function getDescription(selection: MapBottomSheetSelection) {
  const trimmedDescription = selection.item.description.trim();

  if (trimmedDescription) {
    return trimmedDescription;
  }

  return selection.kind === "location"
    ? "Location details are not available yet."
    : "Journey details are not available yet.";
}

function getMetricLabels(
  selection: MapBottomSheetSelection,
  categoryLabel: string,
) {
  const sharedLabels = [categoryLabel, normalizeCounty(selection.item.county)];

  if (selection.kind === "location") {
    return [
      ...sharedLabels,
      getLocationVisitStatusLabel(selection.item),
      `Difficulty ${formatDifficulty(selection.item.difficulty)}`,
      `Experience ${formatCount(selection.item.experience)}`,
    ].filter(Boolean);
  }

  return [
    ...sharedLabels,
    getJourneyCompletionStatusLabel(selection.item),
    formatDistanceLabel(selection.item.distance),
    `Difficulty ${formatDifficulty(selection.item.difficulty)}`,
  ].filter(Boolean);
}

function normalizeCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}

function formatDifficulty(difficulty: number | null | undefined) {
  if (!Number.isFinite(difficulty)) {
    return "?";
  }

  return Math.max(1, Math.round(Number(difficulty)));
}

function formatCount(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return "?";
  }

  return String(Math.max(0, Math.round(Number(value))));
}

function formatDistanceLabel(distanceKm: number | null | undefined) {
  if (!Number.isFinite(distanceKm)) {
    return "Route length unknown";
  }

  const numericDistance = Number(distanceKm);

  if (numericDistance < 10) {
    return `${numericDistance.toFixed(1)} km route`;
  }

  return `${Math.round(numericDistance)} km route`;
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#020617",
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "#D6D3D1",
    backgroundColor: "#FFFCF7",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 18,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEE7DB",
  },
  handleButton: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  summaryDragArea: {
    flex: 1,
  },
  summaryCopy: {
    flex: 1,
    gap: 4,
  },
  activeToggleButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E0EA",
    backgroundColor: "#FFFFFF",
  },
  activeToggleButtonActive: {
    borderColor: "#FACC15",
    backgroundColor: "#FEF3C7",
  },
  activeToggleButtonPressed: {
    opacity: 0.84,
  },
  activeToggleButtonDisabled: {
    opacity: 0.5,
  },
  summaryLabel: {
    color: ACTIVE_STATE_ACCENT,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    paddingBottom: 8,
  },
  expandedScroll: {},
  expandedContent: {
    gap: 18,
    padding: 10,
    paddingTop: 16,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  detailBlock: {
    gap: 8,
  },
  sectionLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  description: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconButton: {
    flexGrow: 0,
    minWidth: 52,
    paddingHorizontal: 0,
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryActionButtonText: {
    color: "#334155",
  },
});
