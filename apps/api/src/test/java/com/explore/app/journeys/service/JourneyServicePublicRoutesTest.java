package com.explore.app.journeys.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyLocationResponse;
import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.mapper.JourneyLocationMapper;
import com.explore.app.journeys.mapper.JourneyMapper;
import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyLocation;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.shared.NotFoundException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class JourneyServicePublicRoutesTest {

    @Mock
    private JourneyRepository journeyRepository;

    @Mock
    private JourneyLocationRepository journeyLocationRepository;

    @Mock
    private JourneyMapper journeyMapper;

    @Mock
    private JourneyLocationMapper journeyLocationMapper;

    @InjectMocks
    private JourneyService journeyService;

    @Test
    void getPublicJourneysUsesActiveJourneysOnly() {
        Journey activeJourney = Journey.builder()
                .id(1L)
                .title("Active journey")
                .status(JourneyStatus.ACTIVE)
                .build();
        JourneyResponse response = JourneyResponse.builder()
                .id(1L)
                .title("Active journey")
                .build();

        when(journeyRepository.findByStatusOrderByCreatedAtDescIdDesc(
                JourneyStatus.ACTIVE,
                PageRequest.of(0, JourneyService.DEFAULT_PAGE_SIZE)))
                .thenReturn(new PageImpl<>(List.of(activeJourney)));
        when(journeyMapper.toResponse(activeJourney)).thenReturn(response);

        List<JourneyResponse> journeys = journeyService.getPublicJourneys();

        assertEquals(List.of(response), journeys);
        verify(journeyRepository).findByStatusOrderByCreatedAtDescIdDesc(
                JourneyStatus.ACTIVE,
                PageRequest.of(0, JourneyService.DEFAULT_PAGE_SIZE));
    }

    @Test
    void getPublicJourneyByIdRejectsInactiveOrMissingJourneys() {
        when(journeyRepository.findByIdAndStatus(5L, JourneyStatus.ACTIVE)).thenReturn(Optional.empty());

        NotFoundException exception = assertThrows(
                NotFoundException.class,
                () -> journeyService.getPublicJourneyById(5L));

        assertEquals("Journey not found", exception.getMessage());
        verify(journeyRepository).findByIdAndStatus(5L, JourneyStatus.ACTIVE);
    }

    @Test
    void getPublicJourneyWithLocationsUsesActiveJourneyAndActiveLocationsOnly() {
        Journey activeJourney = Journey.builder()
                .id(3L)
                .title("Active journey")
                .status(JourneyStatus.ACTIVE)
                .build();
        Location activeLocation = Location.builder()
                .id(9L)
                .title("Visible stop")
                .latitude(59.0)
                .longitude(24.0)
                .status(LocationStatus.ACTIVE)
                .build();
        JourneyLocation activeJourneyLocation = JourneyLocation.builder()
                .id(15L)
                .journey(activeJourney)
                .location(activeLocation)
                .sortOrder(0)
                .build();
        JourneyLocationResponse journeyLocationResponse = JourneyLocationResponse.builder()
                .id(15L)
                .journeyId(3L)
                .locationId(9L)
                .title("Visible stop")
                .build();
        JourneyDetailResponse detailResponse = JourneyDetailResponse.builder()
                .id(3L)
                .title("Active journey")
                .locations(List.of(journeyLocationResponse))
                .build();

        when(journeyRepository.findByIdAndStatus(3L, JourneyStatus.ACTIVE)).thenReturn(Optional.of(activeJourney));
        when(journeyLocationRepository.findByJourneyIdAndLocationStatusOrderBySortOrderAsc(3L, LocationStatus.ACTIVE))
                .thenReturn(List.of(activeJourneyLocation));
        when(journeyLocationMapper.toResponse(activeJourneyLocation)).thenReturn(journeyLocationResponse);
        when(journeyMapper.toDetailResponse(activeJourney, List.of(journeyLocationResponse))).thenReturn(detailResponse);

        JourneyDetailResponse response = journeyService.getPublicJourneyWithLocations(3L);

        assertEquals(detailResponse, response);
        verify(journeyRepository).findByIdAndStatus(3L, JourneyStatus.ACTIVE);
        verify(journeyLocationRepository)
                .findByJourneyIdAndLocationStatusOrderBySortOrderAsc(3L, LocationStatus.ACTIVE);
        verify(journeyLocationRepository, never()).findByJourneyIdOrderBySortOrderAsc(3L);
    }
}
