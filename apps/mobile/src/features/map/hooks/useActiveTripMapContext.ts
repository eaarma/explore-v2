import { useEffect, useState } from "react";
import {
  clearActiveTripSelection,
  getActiveTripSelection,
  getTrip,
  getTripJourneys,
  getTripLocations,
} from "@/src/features/discoveries/storage/discoveryCache";
import type { ActiveTripMapContext } from "@/src/features/map/types/mapStateTypes";

type UseActiveTripMapContextOptions = {
  authUserId: string | null | undefined;
  markTripsUpdated: () => void;
  tripsRevision: number;
};

export function useActiveTripMapContext({
  authUserId,
  markTripsUpdated,
  tripsRevision,
}: UseActiveTripMapContextOptions) {
  const [activeTripMapContext, setActiveTripMapContext] =
    useState<ActiveTripMapContext | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveTripMapContext() {
      const currentUserId = authUserId ?? "";

      if (!currentUserId) {
        if (isMounted) {
          setActiveTripMapContext(null);
        }
        return;
      }

      const activeTripSelection = await getActiveTripSelection(currentUserId);

      if (!activeTripSelection) {
        if (isMounted) {
          setActiveTripMapContext(null);
        }
        return;
      }

      const [trip, tripLocations, tripJourneys] = await Promise.all([
        getTrip(currentUserId, activeTripSelection.tripId),
        getTripLocations(currentUserId, activeTripSelection.tripId),
        getTripJourneys(currentUserId, activeTripSelection.tripId),
      ]);

      if (!trip || trip.isArchived) {
        await clearActiveTripSelection(currentUserId);
        markTripsUpdated();

        if (isMounted) {
          setActiveTripMapContext(null);
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      setActiveTripMapContext({
        tripId: trip.id,
        tripName: trip.name,
        locationIds: new Set(
          tripLocations.map((tripLocation) => tripLocation.locationId),
        ),
        journeyIds: new Set(
          tripJourneys.map((tripJourney) => tripJourney.journeyId),
        ),
        totalCount: tripLocations.length + tripJourneys.length,
      });
    }

    void loadActiveTripMapContext();

    return () => {
      isMounted = false;
    };
  }, [authUserId, markTripsUpdated, tripsRevision]);

  return {
    activeTripMapContext,
    setActiveTripMapContext,
  };
}
