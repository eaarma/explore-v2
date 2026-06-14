import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type {
  MapBottomSheetSelection,
  MapBottomSheetState,
} from "@/src/features/map/types/mapBottomSheetTypes";

const DEFAULT_COLLAPSED_HEIGHT = 110;
const SHEET_SNAP_DRAG_THRESHOLD = 6;

type UseMapSelectionBottomSheetParams = {
  selection: MapBottomSheetSelection | null;
  state: MapBottomSheetState;
  onChangeState: (state: MapBottomSheetState) => void;
};

export function useMapSelectionBottomSheet({
  selection,
  state,
  onChangeState,
}: UseMapSelectionBottomSheetParams) {
  const { height: windowHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_COLLAPSED_HEIGHT);
  const expandedHeight = Math.round(
    Math.min(Math.max(windowHeight * 0.58, 360), windowHeight - 92),
  );
  const collapsedHeight = Math.min(headerHeight, expandedHeight);
  const collapsedOffset = Math.max(0, expandedHeight - collapsedHeight);
  const hiddenOffset = expandedHeight + 36;
  const translateY = useSharedValue(hiddenOffset);
  const dragStartTranslateY = useSharedValue(hiddenOffset);
  const isHeaderDraggingRef = useRef(false);
  const [isHeaderDragging, setIsHeaderDragging] = useState(false);
  const stateRef = useRef(state);

  const animatedBackdropStyle = useAnimatedStyle(
    () => {
      const clampedTranslateY = Math.min(
        Math.max(translateY.value, 0),
        hiddenOffset,
      );

      return {
        opacity: interpolate(
          clampedTranslateY,
          [0, collapsedOffset, hiddenOffset],
          [0.28, 0.12, 0],
          "clamp",
        ),
      };
    },
    [collapsedOffset, hiddenOffset],
  );

  const animatedSheetStyle = useAnimatedStyle(
    () => {
      const clampedTranslateY = Math.min(
        Math.max(translateY.value, 0),
        hiddenOffset,
      );

      return {
        transform: [{ translateY: clampedTranslateY }],
      };
    },
    [hiddenOffset],
  );

  const animateToState = useCallback(
    (nextState: MapBottomSheetState) => {
      translateY.value = withTiming(
        getTranslateYForState(nextState, collapsedOffset, hiddenOffset),
        {
          duration: nextState === "hidden" ? 180 : 220,
          easing: Easing.out(Easing.cubic),
        },
      );
    },
    [collapsedOffset, hiddenOffset, translateY],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!selection) {
      translateY.value = hiddenOffset;
      return;
    }

    if (isHeaderDraggingRef.current) {
      return;
    }

    animateToState(state);
  }, [animateToState, hiddenOffset, selection, state, translateY]);

  const finishDragGesture = useCallback(
    (dy: number) => {
      isHeaderDraggingRef.current = false;
      setIsHeaderDragging(false);

      const nextState =
        dy <= -SHEET_SNAP_DRAG_THRESHOLD
          ? "expanded"
          : dy >= SHEET_SNAP_DRAG_THRESHOLD
            ? "collapsed"
            : stateRef.current;

      animateToState(nextState);

      if (nextState !== stateRef.current) {
        onChangeState(nextState);
      }
    },
    [animateToState, onChangeState],
  );

  const createHeaderPanGesture = useCallback(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin(() => {
          isHeaderDraggingRef.current = true;
          runOnJS(setIsHeaderDragging)(true);
        })
        .onStart(() => {
          cancelAnimation(translateY);
          dragStartTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
          translateY.value = Math.min(
            Math.max(dragStartTranslateY.value + event.translationY, 0),
            collapsedOffset,
          );
        })
        .onFinalize((event) => {
          runOnJS(finishDragGesture)(event.translationY);
        }),
    [collapsedOffset, dragStartTranslateY, finishDragGesture, translateY],
  );

  const handlePanGesture = useMemo(
    () => createHeaderPanGesture(),
    [createHeaderPanGesture],
  );
  const summaryPanGesture = useMemo(
    () => createHeaderPanGesture(),
    [createHeaderPanGesture],
  );

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeaderHeight = Math.ceil(event.nativeEvent.layout.height);

    setHeaderHeight((currentHeaderHeight) =>
      currentHeaderHeight === nextHeaderHeight
        ? currentHeaderHeight
        : nextHeaderHeight,
    );
  }, []);

  return {
    animatedBackdropStyle,
    animatedSheetStyle,
    expandedHeight,
    handleHeaderLayout,
    handlePanGesture,
    isHeaderDragging,
    summaryPanGesture,
  };
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
