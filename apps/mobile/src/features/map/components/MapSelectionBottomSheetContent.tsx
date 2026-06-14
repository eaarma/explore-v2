import { Ionicons } from "@expo/vector-icons";
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import type { MapBottomSheetPresentation } from "@/src/features/map/utils/mapSelectionBottomSheetModel";
import type {
  MapSelectionBottomSheetColors,
  MapSelectionBottomSheetStyles,
} from "@/src/features/map/utils/mapSelectionBottomSheetTheme";

type MapSelectionBottomSheetContentProps = {
  colors: MapSelectionBottomSheetColors;
  handlePanGesture: ReturnType<typeof Gesture.Pan>;
  isActiveTogglePending: boolean;
  isExpanded: boolean;
  isHeaderDragging: boolean;
  onHeaderLayout: (event: LayoutChangeEvent) => void;
  onOpenDetails: () => void;
  onOpenOptions: () => void;
  onRequestClose: () => void;
  onToggleActive: () => void;
  presentation: MapBottomSheetPresentation;
  styles: MapSelectionBottomSheetStyles;
  summaryPanGesture: ReturnType<typeof Gesture.Pan>;
};

export function MapSelectionBottomSheetContent({
  colors,
  handlePanGesture,
  isActiveTogglePending,
  isExpanded,
  isHeaderDragging,
  onHeaderLayout,
  onOpenDetails,
  onOpenOptions,
  onRequestClose,
  onToggleActive,
  presentation,
  styles,
  summaryPanGesture,
}: MapSelectionBottomSheetContentProps) {
  return (
    <>
      <MapSelectionHeader
        colors={colors}
        handlePanGesture={handlePanGesture}
        isActiveTogglePending={isActiveTogglePending}
        isHeaderDragging={isHeaderDragging}
        onHeaderLayout={onHeaderLayout}
        onToggleActive={onToggleActive}
        presentation={presentation}
        styles={styles}
        summaryPanGesture={summaryPanGesture}
      />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.expandedContent}
        pointerEvents={isHeaderDragging ? "none" : "auto"}
        scrollEnabled={isExpanded && !isHeaderDragging}
        showsVerticalScrollIndicator={false}
        style={styles.expandedScroll}
      >
        <MapSelectionMetrics
          colors={colors}
          directDistanceLabel={presentation.directDistanceLabel}
          metricLabels={presentation.metricLabels}
          styles={styles}
        />

        <MapSelectionOverview
          colors={colors}
          description={presentation.description}
          styles={styles}
        />

        <MapSelectionActions
          colors={colors}
          onOpenDetails={onOpenDetails}
          onOpenOptions={onOpenOptions}
          onRequestClose={onRequestClose}
          optionsAccessibilityLabel={presentation.optionsAccessibilityLabel}
          styles={styles}
        />
      </ScrollView>
    </>
  );
}

function MapSelectionHeader({
  colors,
  handlePanGesture,
  isActiveTogglePending,
  isHeaderDragging,
  onHeaderLayout,
  onToggleActive,
  presentation,
  styles,
  summaryPanGesture,
}: {
  colors: MapSelectionBottomSheetColors;
  handlePanGesture: ReturnType<typeof Gesture.Pan>;
  isActiveTogglePending: boolean;
  isHeaderDragging: boolean;
  onHeaderLayout: (event: LayoutChangeEvent) => void;
  onToggleActive: () => void;
  presentation: MapBottomSheetPresentation;
  styles: MapSelectionBottomSheetStyles;
  summaryPanGesture: ReturnType<typeof Gesture.Pan>;
}) {
  return (
    <View
      onLayout={onHeaderLayout}
      style={[
        styles.header,
        {
          borderBottomColor: colors.headerBorder,
        },
      ]}
    >
      <GestureDetector gesture={handlePanGesture}>
        <View style={styles.handleButton}>
          <View
            style={[styles.handle, { backgroundColor: colors.handle }]}
          />
        </View>
      </GestureDetector>

      <View style={styles.summaryRow}>
        <GestureDetector gesture={summaryPanGesture}>
          <View style={styles.summaryDragArea}>
            <View style={styles.summaryCopy}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.summaryLabel },
                ]}
              >
                {presentation.summaryLabel}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.title, { color: colors.title }]}
              >
                {presentation.title}
              </Text>
            </View>
          </View>
        </GestureDetector>

        <Pressable
          accessibilityLabel={presentation.activeToggleLabel}
          accessibilityRole="button"
          disabled={isActiveTogglePending || isHeaderDragging}
          hitSlop={6}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onPressIn={(event) => {
            event.stopPropagation();
            onToggleActive();
          }}
          style={({ pressed }) => [
            styles.activeToggleButton,
            {
              borderColor: presentation.isActive
                ? colors.activeToggleActiveBorder
                : colors.activeToggleBorder,
              backgroundColor: presentation.isActive
                ? colors.activeToggleActiveBackground
                : colors.activeToggleBackground,
            },
            pressed && styles.activeToggleButtonPressed,
            (isActiveTogglePending || isHeaderDragging) &&
              styles.activeToggleButtonDisabled,
          ]}
        >
          <Ionicons
            color={
              presentation.isActive
                ? colors.activeToggleActiveIcon
                : colors.activeToggleIcon
            }
            name={presentation.isActive ? "remove" : "add"}
            size={24}
          />
        </Pressable>
      </View>
    </View>
  );
}

function MapSelectionMetrics({
  colors,
  directDistanceLabel,
  metricLabels,
  styles,
}: {
  colors: MapSelectionBottomSheetColors;
  directDistanceLabel: string | null;
  metricLabels: string[];
  styles: MapSelectionBottomSheetStyles;
}) {
  return (
    <View style={styles.detailBlock}>
      <View style={styles.metricRow}>
        {metricLabels.map((metricLabel) => (
          <View
            key={metricLabel}
            style={[
              styles.metricChip,
              {
                backgroundColor: colors.metricChipBackground,
                borderColor: colors.metricChipBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.metricChipText,
                { color: colors.metricChipText },
              ]}
            >
              {metricLabel}
            </Text>
          </View>
        ))}
      </View>

      {directDistanceLabel ? (
        <View
          style={[
            styles.metricChip,
            styles.distanceBadge,
            {
              backgroundColor: colors.metricChipBackground,
              borderColor: colors.metricChipBorder,
            },
          ]}
        >
          <Ionicons
            color={colors.metricChipText}
            name="navigate-outline"
            size={14}
          />
          <Text
            style={[
              styles.metricChipText,
              styles.distanceBadgeText,
              {
                color: colors.metricChipText,
              },
            ]}
          >
            {directDistanceLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function MapSelectionOverview({
  colors,
  description,
  styles,
}: {
  colors: MapSelectionBottomSheetColors;
  description: string;
  styles: MapSelectionBottomSheetStyles;
}) {
  return (
    <View style={styles.detailBlock}>
      <Text
        style={[styles.sectionLabel, { color: colors.sectionLabel }]}
      >
        Overview
      </Text>
      <Text
        style={[styles.description, { color: colors.description }]}
      >
        {description}
      </Text>
    </View>
  );
}

function MapSelectionActions({
  colors,
  onOpenDetails,
  onOpenOptions,
  onRequestClose,
  optionsAccessibilityLabel,
  styles,
}: {
  colors: MapSelectionBottomSheetColors;
  onOpenDetails: () => void;
  onOpenOptions: () => void;
  onRequestClose: () => void;
  optionsAccessibilityLabel: string;
  styles: MapSelectionBottomSheetStyles;
}) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        onPress={onOpenDetails}
        style={[
          styles.actionButton,
          {
            backgroundColor: colors.primaryButtonBackground,
          },
        ]}
      >
        <Text
          style={[
            styles.actionButtonText,
            { color: colors.primaryButtonText },
          ]}
        >
          View details
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel={optionsAccessibilityLabel}
        accessibilityRole="button"
        onPress={onOpenOptions}
        style={[
          styles.actionButton,
          styles.secondaryActionButton,
          styles.actionIconButton,
          {
            borderColor: colors.secondaryButtonBorder,
            backgroundColor: colors.secondaryButtonBackground,
          },
        ]}
      >
        <Ionicons
          color={colors.secondaryButtonText}
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
            borderColor: colors.secondaryButtonBorder,
            backgroundColor: colors.secondaryButtonBackground,
          },
        ]}
      >
        <Text
          style={[
            styles.actionButtonText,
            styles.secondaryActionButtonText,
            { color: colors.secondaryButtonText },
          ]}
        >
          Hide
        </Text>
      </Pressable>
    </View>
  );
}
