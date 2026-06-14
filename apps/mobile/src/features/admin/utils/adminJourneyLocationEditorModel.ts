import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Location } from "@/src/features/locations/types/locationTypes";

export const JOURNEY_LOCATION_EDITOR_ROW_HEIGHT = 68;
export const JOURNEY_LOCATION_SEARCH_RESULT_LIMIT = 6;

export function createJourneyLocationFromLocation(
  location: Location,
  journeyId: number,
  sortOrder: number,
): JourneyLocation {
  return {
    id: -location.id,
    journeyId,
    locationId: location.id,
    title: location.title,
    description: location.description,
    latitude: location.latitude,
    longitude: location.longitude,
    county: location.county,
    category: location.category,
    imageUrl: location.imageUrl,
    experience: location.experience,
    difficulty: location.difficulty,
    notes: location.notes,
    status: location.status,
    sortOrder,
  };
}

export function normalizeJourneyLocationSortOrder(locations: JourneyLocation[]) {
  return locations.map((location, index) => ({
    ...location,
    sortOrder: index,
  }));
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return nextItems;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getRowVerticalOffset({
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
    return -JOURNEY_LOCATION_EDITOR_ROW_HEIGHT;
  }

  if (
    dragTargetIndex < dragSourceIndex &&
    index >= dragTargetIndex &&
    index < dragSourceIndex
  ) {
    return JOURNEY_LOCATION_EDITOR_ROW_HEIGHT;
  }

  return 0;
}

export function normalizeJourneyLocationCounty(
  county: string | null | undefined,
) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}
