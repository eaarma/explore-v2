import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useLocationSectionColors,
  type LocationSectionColors,
} from "@/src/features/locations/components/locationsSectionShared";
import type { ResolvedTripItem } from "@/src/features/trips/types/tripTypes";

const ROW_HEIGHT = 56;

type TripPlanListProps = {
  isDisabled?: boolean;
  isReorderPending?: boolean;
  onDragStateChange?: ((isDragging: boolean) => void) | null;
  items: ResolvedTripItem[];
  onReorder: (items: ResolvedTripItem[]) => void | Promise<void>;
};

export function TripPlanList({
  isDisabled = false,
  isReorderPending = false,
  onDragStateChange = null,
  items,
  onReorder,
}: TripPlanListProps) {
  const colors = useLocationSectionColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const [orderedItems, setOrderedItems] = useState(items);
  const orderedItemsRef = useRef(items);
  const [draggingItemKey, setDraggingItemKey] = useState<string | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);
  const dragInitialIndexRef = useRef(0);
  const dragCurrentIndexRef = useRef(0);
  const [pendingCommittedOrder, setPendingCommittedOrder] = useState<
    ResolvedTripItem[] | null
  >(null);

  useEffect(() => {
    orderedItemsRef.current = orderedItems;
  }, [orderedItems]);

  useEffect(() => {
    if (draggingItemKey) {
      return;
    }

    if (pendingCommittedOrder) {
      if (areTripItemsInSameOrder(items, pendingCommittedOrder)) {
        setPendingCommittedOrder(null);
      } else if (isReorderPending) {
        return;
      } else {
        setPendingCommittedOrder(null);
      }
    }

    setOrderedItems(items);
    orderedItemsRef.current = items;
  }, [draggingItemKey, isReorderPending, items, pendingCommittedOrder]);

  useEffect(() => {
    return () => {
      onDragStateChange?.(false);
    };
  }, [onDragStateChange]);

  const draggingItem =
    draggingItemKey === null
      ? null
      : orderedItems.find((item) => item.key === draggingItemKey) ?? null;
  const hasEnoughItemsToReorder = orderedItems.length > 1;
  const canDrag = !isDisabled && hasEnoughItemsToReorder;

  const beginDrag = useCallback((itemKey: string, index: number) => {
    if (!canDrag) {
      return;
    }

    dragOffsetY.stopAnimation();
    dragOffsetY.setValue(0);
    dragInitialIndexRef.current = index;
    dragCurrentIndexRef.current = index;
    dragStartIndexRef.current = index;
    setDraggingItemKey(itemKey);
    setDragStartIndex(index);
    setDragTargetIndex(index);
    onDragStateChange?.(true);
  }, [canDrag, dragOffsetY, onDragStateChange]);

  const updateDrag = useCallback((translationY: number) => {
    if (dragStartIndexRef.current === null) {
      return;
    }

    const minimumTranslationY = -dragInitialIndexRef.current * ROW_HEIGHT;
    const maximumTranslationY =
      (orderedItemsRef.current.length - 1 - dragInitialIndexRef.current) *
      ROW_HEIGHT;
    const clampedTranslationY = clamp(
      translationY,
      minimumTranslationY,
      maximumTranslationY,
    );

    dragOffsetY.setValue(clampedTranslationY);

    const targetIndex = clamp(
      Math.round(
        (dragInitialIndexRef.current * ROW_HEIGHT + clampedTranslationY) /
          ROW_HEIGHT,
      ),
      0,
      orderedItemsRef.current.length - 1,
    );

    if (targetIndex === dragCurrentIndexRef.current) {
      return;
    }

    dragCurrentIndexRef.current = targetIndex;
    setDragTargetIndex(targetIndex);
  }, [dragOffsetY]);

  const endDrag = useCallback(() => {
    if (dragStartIndexRef.current === null) {
      return;
    }

    const moved =
      dragCurrentIndexRef.current !== dragInitialIndexRef.current;
    const nextItems = moved
      ? moveItem(
          orderedItemsRef.current,
          dragInitialIndexRef.current,
          dragCurrentIndexRef.current,
        ).map((item, index) => ({
          ...item,
          sortOrder: index,
        }))
      : null;

    if (nextItems) {
      orderedItemsRef.current = nextItems;
      setOrderedItems(nextItems);
      setPendingCommittedOrder(nextItems);
    }

    dragStartIndexRef.current = null;
    setDraggingItemKey(null);
    setDragStartIndex(null);
    setDragTargetIndex(null);
    onDragStateChange?.(false);

    requestAnimationFrame(() => {
      dragOffsetY.setValue(0);
    });

    if (nextItems) {
      void onReorder(nextItems);
    }
  }, [dragOffsetY, onDragStateChange, onReorder]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Plan</Text>
      <Text style={styles.hint}>
        {hasEnoughItemsToReorder
          ? "Drag the handle to reorder your trip."
          : "Add at least two items to start reordering."}
      </Text>

      <View
        style={[
          styles.listCard,
          {
            height: Math.max(orderedItems.length * ROW_HEIGHT, ROW_HEIGHT),
          },
        ]}
      >
        {orderedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No items added yet. Expand an active location or journey and use
              Add to trip.
            </Text>
          </View>
        ) : (
          orderedItems.map((item, index) => {
            const isDragging = item.key === draggingItemKey;

            return (
              <View
                key={item.key}
                style={[
                  styles.rowSlot,
                  isDragging && styles.rowSlotPlaceholder,
                ]}
              >
                <TripPlanRow
                  canDrag={canDrag}
                  isHidden={isDragging}
                  item={item}
                  index={index}
                  verticalOffset={getRowVerticalOffset({
                    dragSourceIndex: dragStartIndex,
                    dragTargetIndex,
                    index,
                    isDragging,
                  })}
                  onDragBegin={beginDrag}
                  onDragEnd={endDrag}
                  onDragMove={updateDrag}
                />
              </View>
            );
          })
        )}

        {draggingItem && dragStartIndex !== null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dragOverlay,
              {
                top: dragStartIndex * ROW_HEIGHT,
                transform: [{ translateY: dragOffsetY }],
              },
            ]}
          >
            <TripPlanOverlayRow item={draggingItem} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

type TripPlanRowProps = {
  canDrag: boolean;
  isHidden?: boolean;
  item: ResolvedTripItem;
  index: number;
  verticalOffset?: number;
  onDragBegin: (itemKey: string, index: number) => void;
  onDragEnd: () => void;
  onDragMove: (translationY: number) => void;
};

function TripPlanRow({
  canDrag,
  isHidden = false,
  item,
  index,
  verticalOffset = 0,
  onDragBegin,
  onDragEnd,
  onDragMove,
}: TripPlanRowProps) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => canDrag,
        onStartShouldSetPanResponder: () => canDrag,
        onMoveShouldSetPanResponderCapture: () => canDrag,
        onMoveShouldSetPanResponder: () => canDrag,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          onDragBegin(item.key, index);
        },
        onPanResponderMove: (_, gestureState) => {
          onDragMove(gestureState.dy);
        },
        onPanResponderRelease: () => {
          onDragEnd();
        },
        onPanResponderTerminate: () => {
          onDragEnd();
        },
        onShouldBlockNativeResponder: () => true,
      }),
    [canDrag, index, item.key, onDragBegin, onDragEnd, onDragMove],
  );

  return (
    <View
      style={[
        stylesStatic.row,
        isHidden && stylesStatic.rowHidden,
        verticalOffset !== 0 && {
          transform: [{ translateY: verticalOffset }],
        },
      ]}
    >
      <View
        accessibilityLabel={
          canDrag ? `Drag to reorder ${item.title}` : "Trip item reorder disabled"
        }
        accessibilityRole="button"
        style={[
          stylesStatic.handle,
          !canDrag && stylesStatic.handleDisabled,
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons
          color={canDrag ? "#64748B" : "#94A3B8"}
          name="reorder-three-outline"
          size={22}
        />
      </View>

      <TripPlanRowContent item={item} />
    </View>
  );
}

function TripPlanOverlayRow({ item }: { item: ResolvedTripItem }) {
  return (
    <View style={stylesStatic.row}>
      <View style={stylesStatic.handle}>
        <Ionicons
          color="#64748B"
          name="reorder-three-outline"
          size={22}
        />
      </View>

      <TripPlanRowContent item={item} isDragging />
    </View>
  );
}

type TripPlanRowContentProps = {
  item: ResolvedTripItem;
  isDragging?: boolean;
};

function TripPlanRowContent({
  item,
  isDragging = false,
}: TripPlanRowContentProps) {
  const colors = useLocationSectionColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.row, isDragging && styles.rowDragging]}>
      <Ionicons
        color={item.completed ? colors.sectionMeta : colors.controlLabel}
        name={item.completed ? "checkmark-circle" : "ellipse-outline"}
        size={18}
      />

      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta}>
          {item.kind === "location" ? "Location" : "Journey"}
        </Text>
      </View>
    </View>
  );
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return nextItems;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRowVerticalOffset({
  dragSourceIndex,
  dragTargetIndex,
  index,
  isDragging,
}: {
  dragSourceIndex: number | null;
  dragTargetIndex: number | null;
  index: number;
  isDragging: boolean;
}) {
  if (
    isDragging ||
    dragSourceIndex === null ||
    dragTargetIndex === null ||
    dragSourceIndex === dragTargetIndex
  ) {
    return 0;
  }

  if (
    dragTargetIndex > dragSourceIndex &&
    index > dragSourceIndex &&
    index <= dragTargetIndex
  ) {
    return -ROW_HEIGHT;
  }

  if (
    dragTargetIndex < dragSourceIndex &&
    index >= dragTargetIndex &&
    index < dragSourceIndex
  ) {
    return ROW_HEIGHT;
  }

  return 0;
}

function areTripItemsInSameOrder(
  left: ResolvedTripItem[],
  right: ResolvedTripItem[],
) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index]?.key !== right[index]?.key) {
      return false;
    }
  }

  return true;
}

function createStyles(colors: LocationSectionColors) {
  return StyleSheet.create({
    wrapper: {
      gap: 10,
    },
    label: {
      color: colors.sectionMeta,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    hint: {
      color: colors.sectionHint,
      fontSize: 13,
      lineHeight: 18,
    },
    listCard: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.searchInputBackground,
    },
    rowSlot: {
      height: ROW_HEIGHT,
      justifyContent: "center",
    },
    rowSlotPlaceholder: {
      opacity: 0.2,
    },
    dragOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 2,
    },
    row: {
      flex: 1,
      height: ROW_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerBorder,
      backgroundColor: colors.searchInputBackground,
      paddingHorizontal: 14,
    },
    rowDragging: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.segmentedActiveBorder,
      backgroundColor: colors.cardBackground,
      shadowColor: "#0F172A",
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 8,
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    rowTitle: {
      color: colors.title,
      fontSize: 15,
      fontWeight: "700",
    },
    rowMeta: {
      color: colors.metaText,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    emptyStateText: {
      color: colors.sectionHint,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}

const stylesStatic = StyleSheet.create({
  row: {
    flex: 1,
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  handle: {
    width: 44,
    height: ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowHidden: {
    opacity: 0,
  },
  handleDisabled: {
    opacity: 0.55,
  },
});
