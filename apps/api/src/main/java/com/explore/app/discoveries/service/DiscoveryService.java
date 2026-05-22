package com.explore.app.discoveries.service;

import com.explore.app.discoveries.dto.DiscoveryCheckRequest;
import com.explore.app.discoveries.dto.DiscoveryCheckResponse;
import com.explore.app.discoveries.dto.DiscoveryJourneyCompletionResult;
import com.explore.app.discoveries.dto.DiscoveryLocationResult;
import com.explore.app.discoveries.dto.OfflineDiscoveryCandidateRequest;
import com.explore.app.discoveries.dto.OfflineDiscoverySyncRequest;
import com.explore.app.journeys.model.JourneyCompletion;
import com.explore.app.journeys.model.JourneyLocation;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.repository.JourneyCompletionRepository;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationDiscovery;
import com.explore.app.locations.model.LocationDiscoverySource;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationDiscoveryRepository;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.user.model.User;
import com.explore.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiscoveryService {

    private static final double DISCOVERY_RADIUS_METERS = 50d;
    private static final double MAX_ALLOWED_ACCURACY_METERS = 100d;

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final LocationDiscoveryRepository locationDiscoveryRepository;
    private final JourneyLocationRepository journeyLocationRepository;
    private final JourneyCompletionRepository journeyCompletionRepository;

    @Transactional
    public DiscoveryCheckResponse check(String userEmail, DiscoveryCheckRequest request) {
        User user = findUserByEmail(userEmail);
        Instant checkedAt = Instant.now();

        if (!isAccuracyValid(request.getAccuracyMeters())) {
            return buildResponse(false, checkedAt, List.of(), List.of());
        }

        List<LocationRepository.DiscoveryCandidateProjection> candidates =
                locationRepository.findDiscoveryCandidates(
                        request.getLatitude(),
                        request.getLongitude(),
                        DISCOVERY_RADIUS_METERS,
                        LocationStatus.ACTIVE.name());

        if (candidates.isEmpty()) {
            return buildResponse(true, checkedAt, List.of(), List.of());
        }

        Map<Long, Double> candidateDistancesByLocationId = candidates.stream()
                .collect(Collectors.toMap(
                        LocationRepository.DiscoveryCandidateProjection::getLocationId,
                        LocationRepository.DiscoveryCandidateProjection::getDistanceMeters,
                        (left, right) -> left,
                        LinkedHashMap::new));

        Set<Long> existingDiscoveryLocationIds = locationDiscoveryRepository
                .findByUserIdAndLocationIdIn(user.getId(), candidateDistancesByLocationId.keySet())
                .stream()
                .map(discovery -> discovery.getLocation().getId())
                .collect(Collectors.toSet());

        if (existingDiscoveryLocationIds.size() == candidateDistancesByLocationId.size()) {
            return buildResponse(true, checkedAt, List.of(), List.of());
        }

        Map<Long, Location> locationsById = locationRepository.findAllById(candidateDistancesByLocationId.keySet())
                .stream()
                .collect(Collectors.toMap(Location::getId, Function.identity()));

        List<LocationDiscovery> discoveriesToSave = candidateDistancesByLocationId.entrySet()
                .stream()
                .filter(entry -> !existingDiscoveryLocationIds.contains(entry.getKey()))
                .map(entry -> toLocationDiscovery(user, request, checkedAt, entry, locationsById))
                .filter(Objects::nonNull)
                .toList();

        if (discoveriesToSave.isEmpty()) {
            return buildResponse(true, checkedAt, List.of(), List.of());
        }

        List<LocationDiscovery> savedDiscoveries = locationDiscoveryRepository.saveAllAndFlush(discoveriesToSave);

        List<DiscoveryLocationResult> discoveredLocations = savedDiscoveries.stream()
                .sorted(Comparator
                        .comparing((LocationDiscovery discovery) -> discovery.getDistanceMeters(), Comparator.nullsLast(Double::compareTo))
                        .thenComparing(discovery -> discovery.getLocation().getId()))
                .map(this::toDiscoveryLocationResult)
                .toList();

        List<DiscoveryJourneyCompletionResult> completedJourneys =
                completeEligibleJourneys(user.getId(), user, savedDiscoveries);

        return buildResponse(true, checkedAt, discoveredLocations, completedJourneys);
    }

    @Transactional
    public DiscoveryCheckResponse syncOffline(String userEmail, OfflineDiscoverySyncRequest request) {
        User user = findUserByEmail(userEmail);
        Instant checkedAt = Instant.now();

        if (request.getDiscoveries() == null || request.getDiscoveries().isEmpty()) {
            return buildResponse(true, checkedAt, List.of(), List.of());
        }

        List<OfflineDiscoveryCandidateRequest> candidates = deduplicateOfflineCandidates(request.getDiscoveries());
        Set<Long> locationIds = candidates.stream()
                .map(OfflineDiscoveryCandidateRequest::getLocationId)
                .collect(Collectors.toSet());

        Set<Long> existingDiscoveryLocationIds = locationDiscoveryRepository
                .findByUserIdAndLocationIdIn(user.getId(), locationIds)
                .stream()
                .map(discovery -> discovery.getLocation().getId())
                .collect(Collectors.toSet());

        Map<Long, Location> locationsById = locationRepository.findAllById(locationIds)
                .stream()
                .collect(Collectors.toMap(Location::getId, Function.identity()));

        List<LocationDiscovery> discoveriesToSave = candidates.stream()
                .filter(candidate -> !existingDiscoveryLocationIds.contains(candidate.getLocationId()))
                .map(candidate -> toOfflineLocationDiscovery(user, candidate, locationsById))
                .flatMap(Optional::stream)
                .toList();

        if (discoveriesToSave.isEmpty()) {
            return buildResponse(true, checkedAt, List.of(), List.of());
        }

        List<LocationDiscovery> savedDiscoveries = locationDiscoveryRepository.saveAllAndFlush(discoveriesToSave);

        List<DiscoveryLocationResult> discoveredLocations = savedDiscoveries.stream()
                .sorted(Comparator
                        .comparing(LocationDiscovery::getDiscoveredAt)
                        .thenComparing(discovery -> discovery.getLocation().getId()))
                .map(this::toDiscoveryLocationResult)
                .toList();

        List<DiscoveryJourneyCompletionResult> completedJourneys =
                completeEligibleJourneys(user.getId(), user, savedDiscoveries);

        return buildResponse(true, checkedAt, discoveredLocations, completedJourneys);
    }

    public List<DiscoveryLocationResult> getUserDiscoveries(String userEmail) {
        User user = findUserByEmail(userEmail);

        return locationDiscoveryRepository.findAllForUserProgress(user.getId())
                .stream()
                .map(this::toDiscoveryLocationResult)
                .toList();
    }

    public List<DiscoveryJourneyCompletionResult> getUserJourneyCompletions(String userEmail) {
        User user = findUserByEmail(userEmail);

        return journeyCompletionRepository.findAllForUserProgress(user.getId())
                .stream()
                .map(this::toDiscoveryJourneyCompletionResult)
                .toList();
    }

    private User findUserByEmail(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is missing");
        }

        return userRepository.findByEmail(userEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private boolean isAccuracyValid(Double accuracyMeters) {
        return accuracyMeters != null && accuracyMeters <= MAX_ALLOWED_ACCURACY_METERS;
    }

    private LocationDiscovery toLocationDiscovery(
            User user,
            DiscoveryCheckRequest request,
            Instant checkedAt,
            Map.Entry<Long, Double> candidateEntry,
            Map<Long, Location> locationsById) {
        Location location = locationsById.get(candidateEntry.getKey());
        if (location == null) {
            return null;
        }

        return LocationDiscovery.builder()
                .user(user)
                .location(location)
                .discoveredAt(checkedAt)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracyMeters(request.getAccuracyMeters())
                .distanceMeters(candidateEntry.getValue())
                .source(LocationDiscoverySource.GPS)
                .build();
    }

    private DiscoveryLocationResult toDiscoveryLocationResult(LocationDiscovery discovery) {
        return DiscoveryLocationResult.builder()
                .locationId(discovery.getLocation().getId())
                .title(discovery.getLocation().getTitle())
                .distanceMeters(discovery.getDistanceMeters())
                .discoveredAt(discovery.getDiscoveredAt())
                .build();
    }

    private DiscoveryJourneyCompletionResult toDiscoveryJourneyCompletionResult(JourneyCompletion completion) {
        return DiscoveryJourneyCompletionResult.builder()
                .journeyId(completion.getJourney().getId())
                .title(completion.getJourney().getTitle())
                .totalLocations(completion.getJourney().getLocations().size())
                .completedAt(completion.getCompletedAt())
                .build();
    }

    private List<OfflineDiscoveryCandidateRequest> deduplicateOfflineCandidates(
            List<OfflineDiscoveryCandidateRequest> discoveries) {
        Map<Long, OfflineDiscoveryCandidateRequest> candidatesByLocationId = discoveries.stream()
                .sorted(Comparator
                        .comparing(OfflineDiscoveryCandidateRequest::getDiscoveredAt)
                        .thenComparing(OfflineDiscoveryCandidateRequest::getLocationId))
                .collect(Collectors.toMap(
                        OfflineDiscoveryCandidateRequest::getLocationId,
                        Function.identity(),
                        (existing, ignored) -> existing,
                        LinkedHashMap::new));

        return List.copyOf(candidatesByLocationId.values());
    }

    private Optional<LocationDiscovery> toOfflineLocationDiscovery(
            User user,
            OfflineDiscoveryCandidateRequest candidate,
            Map<Long, Location> locationsById) {
        Location location = locationsById.get(candidate.getLocationId());
        if (location == null || location.getStatus() != LocationStatus.ACTIVE) {
            return Optional.empty();
        }

        if (!isAccuracyValid(candidate.getAccuracyMeters())) {
            return Optional.empty();
        }

        Double locationLatitude = resolveLocationLatitude(location);
        Double locationLongitude = resolveLocationLongitude(location);
        if (locationLatitude == null || locationLongitude == null) {
            return Optional.empty();
        }

        double distanceMeters = haversineMeters(
                candidate.getLatitude(),
                candidate.getLongitude(),
                locationLatitude,
                locationLongitude);

        if (distanceMeters > DISCOVERY_RADIUS_METERS) {
            return Optional.empty();
        }

        return Optional.of(LocationDiscovery.builder()
                .user(user)
                .location(location)
                .discoveredAt(candidate.getDiscoveredAt())
                .latitude(candidate.getLatitude())
                .longitude(candidate.getLongitude())
                .accuracyMeters(candidate.getAccuracyMeters())
                .distanceMeters(distanceMeters)
                .source(LocationDiscoverySource.SYNCED_OFFLINE)
                .build());
    }

    private List<DiscoveryJourneyCompletionResult> completeEligibleJourneys(
            UUID userId,
            User user,
            List<LocationDiscovery> savedDiscoveries) {
        List<Long> newlyDiscoveredLocationIds = savedDiscoveries.stream()
                .map(discovery -> discovery.getLocation().getId())
                .toList();

        if (newlyDiscoveredLocationIds.isEmpty()) {
            return List.of();
        }

        List<Long> candidateJourneyIds = journeyLocationRepository.findDistinctJourneyIdsByLocationIdInAndJourneyStatus(
                newlyDiscoveredLocationIds,
                JourneyStatus.ACTIVE);

        if (candidateJourneyIds.isEmpty()) {
            return List.of();
        }

        Set<Long> existingCompletionJourneyIds = journeyCompletionRepository
                .findByUserIdAndJourneyIdIn(userId, candidateJourneyIds)
                .stream()
                .map(completion -> completion.getJourney().getId())
                .collect(Collectors.toSet());

        List<Long> journeyIdsToCheck = candidateJourneyIds.stream()
                .filter(journeyId -> !existingCompletionJourneyIds.contains(journeyId))
                .toList();

        if (journeyIdsToCheck.isEmpty()) {
            return List.of();
        }

        List<JourneyLocation> journeyLocations = journeyLocationRepository
                .findJourneyLocationsForCompletion(journeyIdsToCheck);

        if (journeyLocations.isEmpty()) {
            return List.of();
        }

        Map<Long, List<JourneyLocation>> journeyLocationsByJourneyId = journeyLocations.stream()
                .collect(Collectors.groupingBy(
                        journeyLocation -> journeyLocation.getJourney().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        Set<Long> relevantLocationIds = journeyLocations.stream()
                .map(journeyLocation -> journeyLocation.getLocation().getId())
                .collect(Collectors.toSet());

        List<LocationDiscovery> relevantDiscoveries = locationDiscoveryRepository
                .findByUserIdAndLocationIdIn(userId, relevantLocationIds)
                .stream()
                .toList();

        Set<Long> discoveredLocationIds = relevantDiscoveries.stream()
                .map(discovery -> discovery.getLocation().getId())
                .collect(Collectors.toSet());
        Map<Long, Instant> discoveredAtByLocationId = relevantDiscoveries.stream()
                .collect(Collectors.toMap(
                        discovery -> discovery.getLocation().getId(),
                        LocationDiscovery::getDiscoveredAt));

        List<JourneyCompletion> completionsToSave = new ArrayList<>();
        List<DiscoveryJourneyCompletionResult> completedJourneys = new ArrayList<>();

        for (Map.Entry<Long, List<JourneyLocation>> entry : journeyLocationsByJourneyId.entrySet()) {
            List<JourneyLocation> locationsForJourney = entry.getValue();
            if (locationsForJourney.isEmpty()) {
                continue;
            }

            if (!isJourneyFullyDiscovered(locationsForJourney, discoveredLocationIds)) {
                continue;
            }

            Instant completedAt = resolveJourneyCompletedAt(
                    locationsForJourney,
                    discoveredAtByLocationId);

            completionsToSave.add(JourneyCompletion.builder()
                    .user(user)
                    .journey(locationsForJourney.get(0).getJourney())
                    .completedAt(completedAt)
                    .build());

            completedJourneys.add(DiscoveryJourneyCompletionResult.builder()
                    .journeyId(locationsForJourney.get(0).getJourney().getId())
                    .title(locationsForJourney.get(0).getJourney().getTitle())
                    .totalLocations(locationsForJourney.size())
                    .completedAt(completedAt)
                    .build());
        }

        if (!completionsToSave.isEmpty()) {
            journeyCompletionRepository.saveAll(completionsToSave);
        }

        return completedJourneys;
    }

    private Instant resolveJourneyCompletedAt(
            Collection<JourneyLocation> locationsForJourney,
            Map<Long, Instant> discoveredAtByLocationId) {
        Instant completedAt = null;

        for (JourneyLocation journeyLocation : locationsForJourney) {
            Instant discoveredAt = discoveredAtByLocationId.get(journeyLocation.getLocation().getId());
            if (discoveredAt == null) {
                continue;
            }

            if (completedAt == null || discoveredAt.isAfter(completedAt)) {
                completedAt = discoveredAt;
            }
        }

        return completedAt != null ? completedAt : Instant.now();
    }

    private Double resolveLocationLatitude(Location location) {
        if (location.getLatitude() != null) {
            return location.getLatitude();
        }

        if (location.getPoint() != null) {
            return location.getPoint().getY();
        }

        return null;
    }

    private Double resolveLocationLongitude(Location location) {
        if (location.getLongitude() != null) {
            return location.getLongitude();
        }

        if (location.getPoint() != null) {
            return location.getPoint().getX();
        }

        return null;
    }

    private double haversineMeters(double latitude1, double longitude1, double latitude2, double longitude2) {
        double earthRadiusMeters = 6_371_000d;
        double latitudeDelta = Math.toRadians(latitude2 - latitude1);
        double longitudeDelta = Math.toRadians(longitude2 - longitude1);

        double a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
                + Math.cos(Math.toRadians(latitude1)) * Math.cos(Math.toRadians(latitude2))
                * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private boolean isJourneyFullyDiscovered(
            Collection<JourneyLocation> locationsForJourney,
            Set<Long> discoveredLocationIds) {
        for (JourneyLocation journeyLocation : locationsForJourney) {
            if (!discoveredLocationIds.contains(journeyLocation.getLocation().getId())) {
                return false;
            }
        }

        return true;
    }

    private DiscoveryCheckResponse buildResponse(
            boolean accuracyValid,
            Instant checkedAt,
            List<DiscoveryLocationResult> discoveredLocations,
            List<DiscoveryJourneyCompletionResult> completedJourneys) {
        return DiscoveryCheckResponse.builder()
                .accuracyValid(accuracyValid)
                .maxAllowedAccuracyMeters(MAX_ALLOWED_ACCURACY_METERS)
                .discoveryRadiusMeters(DISCOVERY_RADIUS_METERS)
                .discoveredLocationCount(discoveredLocations.size())
                .completedJourneyCount(completedJourneys.size())
                .discoveredLocations(discoveredLocations)
                .completedJourneys(completedJourneys)
                .checkedAt(checkedAt)
                .build();
    }
}
