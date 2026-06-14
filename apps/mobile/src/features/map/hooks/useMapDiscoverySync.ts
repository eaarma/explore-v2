import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AuthStatus, AuthUser } from "@/src/features/auth/types/authTypes";
import { checkDiscoveries } from "@/src/features/discoveries/api/discoveriesApi";
import {
  captureOfflineDiscoveryCheck,
  cacheDiscoveryCheckResult,
} from "@/src/features/discoveries/storage/discoveryCache";
import { buildDiscoveryBannerMessage } from "@/src/features/discoveries/utils/discoveryPresentation";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import type { DiscoveryBanner } from "@/src/features/map/types/mapStateTypes";
import { hasValidCoordinates } from "@/src/features/map/utils/mapFeatureCollection";
import {
  applyDiscoveryResultsToJourneys,
  applyDiscoveryResultsToLocations,
  shouldShowDiscoveryFeedback,
  shouldTriggerDiscoveryCheck,
} from "@/src/features/map/utils/mapDiscovery";
import { hydrateMapContent } from "@/src/features/map/utils/mapContent";
import {
  getApiErrorMessage,
  isApiNetworkError,
} from "@/src/shared/api/apiError";
import { syncAllContentCaches } from "@/src/features/content/storage/contentSync";

type CurrentPosition = {
  coords?: {
    accuracy?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  timestamp?: number | null;
} | null | undefined;

type UseMapDiscoverySyncOptions = {
  authStatus: AuthStatus;
  authUser: AuthUser | null;
  currentPosition: CurrentPosition;
  journeys: Journey[];
  journeysById: Map<number, Journey>;
  locationPermissionGranted: boolean;
  locations: Location[];
  locationsById: Map<number, Location>;
  markContentUpdated: () => void;
  markDiscoveryProgressUpdated: () => void;
  setJourneys: Dispatch<SetStateAction<Journey[]>>;
  setLocations: Dispatch<SetStateAction<Location[]>>;
};

export function useMapDiscoverySync({
  authStatus,
  authUser,
  currentPosition,
  journeys,
  journeysById,
  locationPermissionGranted,
  locations,
  locationsById,
  markContentUpdated,
  markDiscoveryProgressUpdated,
  setJourneys,
  setLocations,
}: UseMapDiscoverySyncOptions) {
  const [discoveryBanner, setDiscoveryBanner] =
    useState<DiscoveryBanner | null>(null);
  const discoveryCheckInFlightRef = useRef(false);
  const lastDiscoveryCheckRef = useRef<{
    latitude: number;
    longitude: number;
    at: number;
  } | null>(null);
  const lastAccuracyWarningAtRef = useRef(0);
  const lastDiscoveryErrorAtRef = useRef(0);

  useEffect(() => {
    if (!discoveryBanner) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setDiscoveryBanner(null);
    }, 4200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [discoveryBanner]);

  useEffect(() => {
    const isAuthenticatedSession =
      authStatus === "authenticated-online" ||
      authStatus === "authenticated-offline";
    const sessionUser = authUser;

    if (!isAuthenticatedSession || !sessionUser) {
      return;
    }

    const authenticatedUser = sessionUser;

    if (!locationPermissionGranted) {
      return;
    }

    const latitude = Number(currentPosition?.coords?.latitude);
    const longitude = Number(currentPosition?.coords?.longitude);
    const accuracyMeters = Number(currentPosition?.coords?.accuracy);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(accuracyMeters) ||
      accuracyMeters < 0
    ) {
      return;
    }

    if (
      !shouldTriggerDiscoveryCheck(
        lastDiscoveryCheckRef.current,
        latitude,
        longitude,
      )
    ) {
      return;
    }

    if (discoveryCheckInFlightRef.current) {
      return;
    }

    lastDiscoveryCheckRef.current = {
      latitude,
      longitude,
      at: Date.now(),
    };
    discoveryCheckInFlightRef.current = true;

    void (async () => {
      async function finalizeDiscoveryResult(
        discoveryResult: Awaited<ReturnType<typeof checkDiscoveries>>,
        options: {
          persistToCache: boolean;
          offlineCapture: boolean;
        },
      ) {
        if (!discoveryResult.accuracyValid) {
          if (shouldShowDiscoveryFeedback(lastAccuracyWarningAtRef.current)) {
            lastAccuracyWarningAtRef.current = Date.now();
            setDiscoveryBanner({
              tone: "warning",
              text: `GPS accuracy is too low to confirm discoveries yet. Move closer or wait for accuracy below ${Math.round(discoveryResult.maxAllowedAccuracyMeters)} m.`,
            });
          }

          return false;
        }

        if (options.persistToCache) {
          await cacheDiscoveryCheckResult(
            authenticatedUser.id,
            discoveryResult,
          );
        }

        if (
          discoveryResult.discoveredLocationCount === 0 &&
          discoveryResult.completedJourneyCount === 0
        ) {
          return false;
        }

        setLocations((currentLocations) =>
          applyDiscoveryResultsToLocations(
            currentLocations,
            discoveryResult.discoveredLocations,
          ),
        );
        setJourneys((currentJourneys) =>
          applyDiscoveryResultsToJourneys(
            currentJourneys,
            discoveryResult.completedJourneys,
          ),
        );

        const bannerMessage = buildDiscoveryBannerMessage(discoveryResult);
        markDiscoveryProgressUpdated();

        if (bannerMessage) {
          setDiscoveryBanner({
            tone: "success",
            text: options.offlineCapture
              ? `${bannerMessage}. Saved offline and will sync when you're back online.`
              : bannerMessage,
          });
        }

        const hasUnknownDiscoveredContent =
          discoveryResult.discoveredLocations.some(
            (discovery) => !locationsById.has(discovery.locationId),
          ) ||
          discoveryResult.completedJourneys.some(
            (journey) => !journeysById.has(journey.journeyId),
          );

        if (hasUnknownDiscoveredContent && !options.offlineCapture) {
          try {
            const syncedContent = await syncAllContentCaches();
            const hydratedContent = await hydrateMapContent(
              syncedContent.locations.filter(hasValidCoordinates),
              syncedContent.journeys.filter(hasValidCoordinates),
              authenticatedUser.id,
            );

            setLocations(hydratedContent.locations);
            setJourneys(hydratedContent.journeys);
            markContentUpdated();
          } catch {
            // Keep the discovery result visible even if refreshing the full map content fails.
          }
        }

        return true;
      }

      try {
        if (authStatus === "authenticated-offline") {
          await finalizeDiscoveryResult(
            await captureOfflineDiscoveryCheck({
              userId: authenticatedUser.id,
              latitude,
              longitude,
              accuracyMeters,
              locations,
              journeys,
            }),
            {
              persistToCache: false,
              offlineCapture: true,
            },
          );
          return;
        }

        const discoveryResult = await checkDiscoveries({
          latitude,
          longitude,
          accuracyMeters,
        });
        await finalizeDiscoveryResult(discoveryResult, {
          persistToCache: true,
          offlineCapture: false,
        });
      } catch (error) {
        if (isApiNetworkError(error)) {
          try {
            const didCaptureOffline = await finalizeDiscoveryResult(
              await captureOfflineDiscoveryCheck({
                userId: authenticatedUser.id,
                latitude,
                longitude,
                accuracyMeters,
                locations,
                journeys,
              }),
              {
                persistToCache: false,
                offlineCapture: true,
              },
            );

            if (didCaptureOffline) {
              return;
            }
          } catch {
            // Fall through to the offline warning banner below.
          }
        }

        if (!shouldShowDiscoveryFeedback(lastDiscoveryErrorAtRef.current)) {
          return;
        }

        lastDiscoveryErrorAtRef.current = Date.now();
        setDiscoveryBanner({
          tone: isApiNetworkError(error) ? "warning" : "error",
          text: isApiNetworkError(error)
            ? "Discovery sync paused while you're offline."
            : getApiErrorMessage(
                error,
                "Could not sync nearby discoveries right now.",
              ),
        });
      } finally {
        discoveryCheckInFlightRef.current = false;
      }
    })();
  }, [
    authStatus,
    authUser,
    currentPosition?.coords?.accuracy,
    currentPosition?.coords?.latitude,
    currentPosition?.coords?.longitude,
    currentPosition?.timestamp,
    journeys,
    journeysById,
    locationPermissionGranted,
    locations,
    locationsById,
    markContentUpdated,
    markDiscoveryProgressUpdated,
    setJourneys,
    setLocations,
  ]);

  return {
    discoveryBanner,
    showDiscoveryBanner: setDiscoveryBanner,
  };
}
