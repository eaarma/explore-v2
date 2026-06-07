import { useEffect, useState } from "react";

import { getJourneyLocations } from "@/src/features/journeys/api/journeysApi";
import type { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import {
  bootstrapJourneyLocationsCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import type { SelectedJourneyMapContext } from "@/src/features/map/types/mapStateTypes";
import {
  getCachedJourneyLocationsByJourneyId,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";

type JourneyCoordinate = {
  latitude: number;
  longitude: number;
};

type UseSelectedJourneyMapContextOptions = {
  contentRevision: number;
  selectedJourneyCoordinate: JourneyCoordinate | null;
  selectedJourneyId: number | null;
};

export function useSelectedJourneyMapContext({
  contentRevision,
  selectedJourneyCoordinate,
  selectedJourneyId,
}: UseSelectedJourneyMapContextOptions) {
  const [selectedJourneyMapContext, setSelectedJourneyMapContext] =
    useState<SelectedJourneyMapContext | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSelectedJourneyMapContext() {
      if (selectedJourneyId === null) {
        if (isMounted) {
          setSelectedJourneyMapContext(null);
        }
        return;
      }

      let journeyLocations: JourneyLocation[] = [];

      try {
        await initializeContentCache();
        journeyLocations =
          await getCachedJourneyLocationsByJourneyId(selectedJourneyId);
      } catch {
        journeyLocations = [];
      }

      if (journeyLocations.length === 0) {
        try {
          const { didBootstrap } = await bootstrapJourneyLocationsCacheIfNeeded();

          if (didBootstrap || journeyLocations.length === 0) {
            journeyLocations =
              await getCachedJourneyLocationsByJourneyId(selectedJourneyId);
          }
        } catch {
          journeyLocations = [];
        }
      }

      if (journeyLocations.length === 0) {
        try {
          journeyLocations = await getJourneyLocations(selectedJourneyId);
        } catch {
          journeyLocations = [];
        }
      }

      if (!isMounted) {
        return;
      }

      if (journeyLocations.length === 0) {
        setSelectedJourneyMapContext(null);
        return;
      }

      setSelectedJourneyMapContext({
        bounds: buildJourneyBounds(journeyLocations, selectedJourneyCoordinate),
        journeyId: selectedJourneyId,
        locationIds: new Set(
          journeyLocations.map((journeyLocation) => journeyLocation.locationId),
        ),
      });
    }

    void loadSelectedJourneyMapContext();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, selectedJourneyCoordinate, selectedJourneyId]);

  return {
    selectedJourneyMapContext,
  };
}

function buildJourneyBounds(
  journeyLocations: JourneyLocation[],
  selectedJourneyCoordinate: JourneyCoordinate | null,
): [number, number, number, number] | null {
  const validCoordinates = journeyLocations
    .map((journeyLocation) => ({
      latitude: Number(journeyLocation.latitude),
      longitude: Number(journeyLocation.longitude),
    }))
    .filter(
      (coordinate) =>
        Number.isFinite(coordinate.latitude) &&
        Number.isFinite(coordinate.longitude),
    );

  if (
    selectedJourneyCoordinate &&
    Number.isFinite(selectedJourneyCoordinate.latitude) &&
    Number.isFinite(selectedJourneyCoordinate.longitude)
  ) {
    validCoordinates.push(selectedJourneyCoordinate);
  }

  if (validCoordinates.length === 0) {
    return null;
  }

  let west = validCoordinates[0].longitude;
  let east = validCoordinates[0].longitude;
  let south = validCoordinates[0].latitude;
  let north = validCoordinates[0].latitude;

  for (const coordinate of validCoordinates) {
    west = Math.min(west, coordinate.longitude);
    east = Math.max(east, coordinate.longitude);
    south = Math.min(south, coordinate.latitude);
    north = Math.max(north, coordinate.latitude);
  }

  if (west === east) {
    west -= 0.01;
    east += 0.01;
  }

  if (south === north) {
    south -= 0.01;
    north += 0.01;
  }

  return [west, south, east, north];
}
