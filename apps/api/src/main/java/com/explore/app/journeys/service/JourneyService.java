package com.explore.app.journeys.service;

import com.explore.app.journeys.mapper.JourneyLocationMapper;
import com.explore.app.journeys.mapper.JourneyMapper;
import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.journeys.dto.JourneyCreateRequest;
import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.dto.JourneyUpdateRequest;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.shared.CategoryNormalizer;
import com.explore.app.shared.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JourneyService {

    public static final int DEFAULT_PAGE_SIZE = 100;

    private final JourneyRepository journeyRepository;
    private final JourneyLocationRepository journeyLocationRepository;
    private final JourneyMapper journeyMapper;
    private final JourneyLocationMapper journeyLocationMapper;

    public List<JourneyResponse> getPublicJourneys() {
        return getPublicJourneys(0, DEFAULT_PAGE_SIZE);
    }

    public List<JourneyResponse> getPublicJourneys(int page, int size) {
        return getActiveJourneys(page, size);
    }

    public JourneyResponse getPublicJourneyById(Long id) {
        return journeyMapper.toResponse(findActiveJourney(id));
    }

    public List<JourneyResponse> getPublicJourneysByCategory(String category) {
        return getPublicJourneysByCategory(category, 0, DEFAULT_PAGE_SIZE);
    }

    public List<JourneyResponse> getPublicJourneysByCategory(String category, int page, int size) {
        return journeyRepository.findByCategoryIgnoreCaseAndStatusOrderByCreatedAtDescIdDesc(
                        normalizeCategoryFilter(category),
                        JourneyStatus.ACTIVE,
                        createPageRequest(page, size))
                .getContent()
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getPublicJourneysByCounty(String county) {
        return getPublicJourneysByCounty(county, 0, DEFAULT_PAGE_SIZE);
    }

    public List<JourneyResponse> getPublicJourneysByCounty(String county, int page, int size) {
        return journeyRepository.findByCountyIgnoreCaseAndStatusOrderByCreatedAtDescIdDesc(
                        normalizeFilter(county, "county"),
                        JourneyStatus.ACTIVE,
                        createPageRequest(page, size))
                .getContent()
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getPublicNearbyJourneys(double latitude, double longitude, double radiusMeters) {
        return getPublicNearbyJourneys(latitude, longitude, radiusMeters, 0, DEFAULT_PAGE_SIZE);
    }

    public List<JourneyResponse> getPublicNearbyJourneys(
            double latitude,
            double longitude,
            double radiusMeters,
            int page,
            int size) {
        validateRadius(radiusMeters);

        return journeyRepository.findNearbyByStatus(
                        latitude,
                        longitude,
                        radiusMeters,
                        JourneyStatus.ACTIVE.name(),
                        createPageRequest(page, size))
                .getContent()
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public JourneyDetailResponse getPublicJourneyWithLocations(Long journeyId) {
        Journey journey = findActiveJourney(journeyId);
        return journeyMapper.toDetailResponse(
                journey,
                journeyLocationRepository
                        .findByJourneyIdAndLocationStatusOrderBySortOrderAsc(journeyId, LocationStatus.ACTIVE)
                        .stream()
                        .map(journeyLocationMapper::toResponse)
                        .toList());
    }

    public List<JourneyResponse> getAllJourneys() {
        return getPublicJourneys();
    }

    public JourneyResponse getJourneyById(Long id) {
        return journeyMapper.toResponse(findJourney(id));
    }

    public List<JourneyResponse> getActiveJourneys() {
        return getActiveJourneys(0, DEFAULT_PAGE_SIZE);
    }

    public List<JourneyResponse> getActiveJourneys(int page, int size) {
        return journeyRepository.findByStatusOrderByCreatedAtDescIdDesc(
                        JourneyStatus.ACTIVE,
                        createPageRequest(page, size))
                .getContent()
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getJourneysByCategory(String category) {
        return getJourneysByCategory(category, 0, DEFAULT_PAGE_SIZE);
    }

    public List<JourneyResponse> getJourneysByCategory(String category, int page, int size) {
        return journeyRepository.findByCategoryIgnoreCaseOrderByCreatedAtDescIdDesc(
                        normalizeCategoryFilter(category),
                        createPageRequest(page, size))
                .getContent()
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getJourneysByCounty(String county) {
        return getJourneysByCounty(county, 0, DEFAULT_PAGE_SIZE);
    }

    public List<JourneyResponse> getJourneysByCounty(String county, int page, int size) {
        return journeyRepository.findByCountyIgnoreCaseOrderByCreatedAtDescIdDesc(
                        normalizeFilter(county, "county"),
                        createPageRequest(page, size))
                .getContent()
                .stream()
                .map(journeyMapper::toResponse)
                .toList();
    }

    public List<JourneyResponse> getNearbyJourneys(double latitude, double longitude, double radiusMeters) {
        return getPublicNearbyJourneys(latitude, longitude, radiusMeters);
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

    private Journey findJourney(Long id) {
        return journeyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Journey not found"));
    }

    private Journey findActiveJourney(Long id) {
        return journeyRepository.findByIdAndStatus(id, JourneyStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Journey not found"));
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

    private Pageable createPageRequest(int page, int size) {
        return PageRequest.of(page, size);
    }
}





