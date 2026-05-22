package com.explore.app.journeys.service;

import com.explore.app.journeys.mapper.JourneyLocationMapper;
import com.explore.app.journeys.mapper.JourneyMapper;
import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.journeys.dto.JourneyCreateRequest;
import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyProgressResponse;
import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.dto.JourneyUpdateRequest;
import com.explore.app.shared.CategoryNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JourneyService {

    private static final String JOURNEY_PROGRESS_NOT_IMPLEMENTED =
            "Journey completion is not implemented yet. Persistence tables are in place, but the service logic will be added in a later step.";

    private final JourneyRepository journeyRepository;
    private final JourneyLocationRepository journeyLocationRepository;
    private final JourneyMapper journeyMapper;
    private final JourneyLocationMapper journeyLocationMapper;

    public List<JourneyResponse> getAllJourneys() {
        return journeyRepository.findAll()
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public JourneyResponse getJourneyById(Long id) {
        return journeyMapper.toResponse(findJourney(id));
    }

    public List<JourneyResponse> getActiveJourneys() {
        return journeyRepository.findByStatus(JourneyStatus.ACTIVE)
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getJourneysByCategory(String category) {
        return journeyRepository.findByCategoryIgnoreCase(normalizeCategoryFilter(category))
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getJourneysByCounty(String county) {
        return journeyRepository.findByCountyIgnoreCase(normalizeFilter(county, "county"))
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getNearbyJourneys(double latitude, double longitude, double radiusMeters) {
        validateRadius(radiusMeters);

        return journeyRepository.findAll()
                .stream()
                .filter(journey -> journey.getLatitude() != null && journey.getLongitude() != null)
                .filter(journey -> haversineMeters(
                        latitude,
                        longitude,
                        journey.getLatitude(),
                        journey.getLongitude()) <= radiusMeters)
                .map(journeyMapper::toResponse)
                .toList();
    }

    public JourneyDetailResponse getJourneyWithLocations(Long journeyId) {
        Journey journey = findJourney(journeyId);
        return journeyMapper.toDetailResponse(
                journey,
                journeyLocationRepository.findByJourneyIdOrderBySortOrderAsc(journeyId)
                        .stream()
                        .map(journeyLocationMapper::toResponse)
                        .toList());
    }

    @Transactional
    public JourneyResponse createJourney(JourneyCreateRequest request) {
        Journey savedJourney = journeyRepository.save(journeyMapper.toEntity(request));
        return journeyMapper.toResponse(savedJourney);
    }

    @Transactional
    public JourneyResponse updateJourney(Long id, JourneyUpdateRequest request) {
        Journey journey = findJourney(id);
        journeyMapper.updateEntity(journey, request);
        return journeyMapper.toResponse(journey);
    }

    @Transactional
    public void updateJourneyStatus(Long id, Integer status) {
        Journey journey = findJourney(id);
        journey.setStatus(journeyMapper.toStatus(status));
    }

    public List<JourneyResponse> getJourneysWithUserProgress(Long userId) {
        throw new UnsupportedOperationException(JOURNEY_PROGRESS_NOT_IMPLEMENTED);
    }

    @Transactional
    public JourneyProgressResponse completeJourneyIfEligible(Long userId, Long journeyId) {
        throw new UnsupportedOperationException(JOURNEY_PROGRESS_NOT_IMPLEMENTED);
    }

    private Journey findJourney(Long id) {
        return journeyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Journey not found"));
    }

    private String normalizeFilter(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }

        return value.trim();
    }

    private String normalizeCategoryFilter(String value) {
        return CategoryNormalizer.normalizeOptionalCategory(normalizeFilter(value, "category"));
    }

    private void validateRadius(double radiusMeters) {
        if (radiusMeters < 0) {
            throw new IllegalArgumentException("Radius must be zero or greater");
        }
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
}





