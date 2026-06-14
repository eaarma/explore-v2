import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import { hasValidCoordinates } from "@/src/features/map/utils/mapFeatureCollection";
import {
  hydrateMapContent,
  loadLiveMapData,
  resolveVisibleMapDataError,
} from "@/src/features/map/utils/mapContent";
import {
  bootstrapContentCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import {
  getCachedJourneys,
  getCachedLocations,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";

type UseMapContentOptions = {
  activeItemsRevision: number;
  authUserId: string | null | undefined;
  contentRevision: number;
};

export function useMapContent({
  activeItemsRevision,
  authUserId,
  contentRevision,
}: UseMapContentOptions) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isMapDataLoading, setIsMapDataLoading] = useState(true);
  const [mapDataError, setMapDataError] = useState<string | null>(null);
  const locationsRef = useRef(locations);
  const journeysRef = useRef(journeys);
  locationsRef.current = locations;
  journeysRef.current = journeys;

  useEffect(() => {
    let isMounted = true;

    async function syncMapFlags() {
      if (
        !authUserId ||
        (locationsRef.current.length === 0 && journeysRef.current.length === 0)
      ) {
        return;
      }

      const hydratedContent = await hydrateMapContent(
        locationsRef.current,
        journeysRef.current,
        authUserId,
      );

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setLocations(hydratedContent.locations);
        setJourneys(hydratedContent.journeys);
      });
    }

    void syncMapFlags();

    return () => {
      isMounted = false;
    };
  }, [activeItemsRevision, authUserId]);

  useEffect(() => {
    let isMounted = true;

    async function loadMapData() {
      setIsMapDataLoading(true);
      setMapDataError(null);

      let nextLocations: Location[] = [];
      let nextJourneys: Journey[] = [];
      let nextMapDataError: string | null = null;

      try {
        await initializeContentCache();

        [nextLocations, nextJourneys] = await Promise.all([
          getCachedLocations(),
          getCachedJourneys(),
        ]);

        nextLocations = nextLocations.filter(hasValidCoordinates);
        nextJourneys = nextJourneys.filter(hasValidCoordinates);
        ({ locations: nextLocations, journeys: nextJourneys } =
          await hydrateMapContent(nextLocations, nextJourneys, authUserId));

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(nextLocations);
          setJourneys(nextJourneys);
          setMapDataError(null);
        });

        if (nextLocations.length > 0 || nextJourneys.length > 0) {
          setIsMapDataLoading(false);
        }

        try {
          const { didBootstrap } = await bootstrapContentCacheIfNeeded();

          if (didBootstrap) {
            const [cachedLocations, cachedJourneys] = await Promise.all([
              getCachedLocations(),
              getCachedJourneys(),
            ]);

            nextLocations = cachedLocations.filter(hasValidCoordinates);
            nextJourneys = cachedJourneys.filter(hasValidCoordinates);
            ({ locations: nextLocations, journeys: nextJourneys } =
              await hydrateMapContent(
                nextLocations,
                nextJourneys,
                authUserId,
              ));
          }
        } catch {
          if (nextLocations.length === 0 || nextJourneys.length === 0) {
            const liveMapData = await loadLiveMapData();

            nextLocations =
              liveMapData.locations.length > 0
                ? liveMapData.locations
                : nextLocations;
            nextJourneys =
              liveMapData.journeys.length > 0
                ? liveMapData.journeys
                : nextJourneys;
            ({ locations: nextLocations, journeys: nextJourneys } =
              await hydrateMapContent(
                nextLocations,
                nextJourneys,
                authUserId,
              ));
            nextMapDataError = resolveVisibleMapDataError(
              liveMapData.locationsResult,
              liveMapData.journeysResult,
              nextLocations.length,
              nextJourneys.length,
            );

            if (!isMounted) {
              return;
            }
          }
        }

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(nextLocations);
          setJourneys(nextJourneys);
          setMapDataError(nextMapDataError);
        });
      } catch {
        const liveMapData = await loadLiveMapData();
        const hydratedContent = await hydrateMapContent(
          liveMapData.locations,
          liveMapData.journeys,
          authUserId,
        );

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(hydratedContent.locations);
          setJourneys(hydratedContent.journeys);
          setMapDataError(
            resolveVisibleMapDataError(
              liveMapData.locationsResult,
              liveMapData.journeysResult,
              liveMapData.locations.length,
              liveMapData.journeys.length,
            ),
          );
        });
      } finally {
        if (isMounted) {
          setIsMapDataLoading(false);
        }
      }
    }

    void loadMapData();

    return () => {
      isMounted = false;
    };
  }, [authUserId, contentRevision]);

  return {
    isMapDataLoading,
    journeys,
    locations,
    mapDataError,
    setJourneys,
    setLocations,
  };
}
