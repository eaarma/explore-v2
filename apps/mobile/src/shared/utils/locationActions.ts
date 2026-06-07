import { Linking, Platform, Share } from "react-native";

import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  showAppDialog,
  showAppToast,
} from "@/src/shared/store/appFeedbackStore";

type LocationActionTarget = Pick<
  Location,
  "title" | "county" | "latitude" | "longitude"
>;
type JourneyActionTarget = Pick<
  Journey,
  "title" | "county" | "latitude" | "longitude"
>;
type CoordinateActionTarget = {
  county: string | null | undefined;
  latitude: number;
  longitude: number;
  title: string;
};

const OPEN_LOCATION_ERROR = "Could not open this location in maps.";
const SHARE_LOCATION_ERROR = "Could not share this location right now.";

export function showLocationOptionsDialog(location: LocationActionTarget) {
  showCoordinateOptionsDialog({
    target: location,
    emptyTitle: "Pinned location",
    message:
      "Open this location in maps or share a link another maps app can open.",
  });
}

export function showJourneyOptionsDialog(journey: JourneyActionTarget) {
  showCoordinateOptionsDialog({
    target: journey,
    emptyTitle: "Pinned journey",
    message:
      "Open this journey in maps or share a link another maps app can open.",
  });
}

function showCoordinateOptionsDialog({
  target,
  emptyTitle,
  message,
}: {
  emptyTitle: string;
  message: string;
  target: CoordinateActionTarget;
}) {
  if (!hasValidCoordinates(target)) {
    showAppToast({
      tone: "error",
      text: OPEN_LOCATION_ERROR,
    });
    return;
  }

  showAppDialog({
    title: getTargetTitle(target, emptyTitle),
    message,
    dismissOnBackdropPress: true,
    primaryAction: {
      label: "Open in Maps",
      onPress: () => {
        void openLocationInMaps(target, emptyTitle);
      },
    },
    secondaryAction: {
      label: "Share location",
      onPress: () => {
        void shareLocation(target, emptyTitle);
      },
    },
  });
}

async function openLocationInMaps(
  target: CoordinateActionTarget,
  emptyTitle: string,
) {
  const preferredMapsUrl = buildPreferredMapsUrl(target, emptyTitle);
  const universalMapsUrl = buildUniversalMapsUrl(target);

  try {
    await Linking.openURL(preferredMapsUrl);
    return;
  } catch {
    try {
      await Linking.openURL(universalMapsUrl);
      return;
    } catch {
      showAppToast({
        tone: "error",
        text: OPEN_LOCATION_ERROR,
      });
    }
  }
}

async function shareLocation(
  target: CoordinateActionTarget,
  emptyTitle: string,
) {
  try {
    const universalMapsUrl = buildUniversalMapsUrl(target);

    await Share.share({
      title: getTargetTitle(target, emptyTitle),
      message: buildLocationShareMessage(target, universalMapsUrl, emptyTitle),
      url: universalMapsUrl,
    });
  } catch {
    showAppToast({
      tone: "error",
      text: SHARE_LOCATION_ERROR,
    });
  }
}

function buildPreferredMapsUrl(
  target: CoordinateActionTarget,
  emptyTitle: string,
) {
  if (Platform.OS === "android") {
    return buildGeoUri(target, emptyTitle);
  }

  if (Platform.OS === "ios") {
    return buildAppleMapsUrl(target, emptyTitle);
  }

  return buildUniversalMapsUrl(target);
}

function buildGeoUri(target: CoordinateActionTarget, emptyTitle: string) {
  const latitude = Number(target.latitude);
  const longitude = Number(target.longitude);
  const label = encodeURIComponent(getTargetTitle(target, emptyTitle));

  return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
}

function buildAppleMapsUrl(
  target: CoordinateActionTarget,
  emptyTitle: string,
) {
  const latitude = Number(target.latitude);
  const longitude = Number(target.longitude);
  const label = encodeURIComponent(getTargetTitle(target, emptyTitle));

  return `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`;
}

function buildUniversalMapsUrl(target: CoordinateActionTarget) {
  const latitude = Number(target.latitude);
  const longitude = Number(target.longitude);

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function buildLocationShareMessage(
  target: CoordinateActionTarget,
  universalMapsUrl: string,
  emptyTitle: string,
) {
  const county = normalizeCounty(target.county);
  const coordinates = formatCoordinates(target);

  return [getTargetTitle(target, emptyTitle), county, coordinates, universalMapsUrl]
    .filter((line) => line.length > 0)
    .join("\n");
}

function formatCoordinates(target: CoordinateActionTarget) {
  return `${Number(target.latitude).toFixed(6)}, ${Number(target.longitude).toFixed(6)}`;
}

function normalizeCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  return trimmedCounty;
}

function getTargetTitle(
  target: CoordinateActionTarget,
  emptyTitle: string,
) {
  const trimmedTitle = target.title.trim();

  if (trimmedTitle.length > 0) {
    return trimmedTitle;
  }

  return emptyTitle;
}

function hasValidCoordinates(target: CoordinateActionTarget) {
  return (
    Number.isFinite(target.latitude) && Number.isFinite(target.longitude)
  );
}
