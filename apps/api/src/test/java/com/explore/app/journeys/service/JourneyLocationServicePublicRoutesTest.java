package com.explore.app.journeys.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.explore.app.journeys.dto.JourneyLocationResponse;
import com.explore.app.journeys.mapper.JourneyLocationMapper;
import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyLocation;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class JourneyLocationServicePublicRoutesTest {

    @Mock
    private JourneyRepository journeyRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private JourneyLocationRepository journeyLocationRepository;

    @Mock
    private JourneyLocationMapper journeyLocationMapper;

    @InjectMocks
    private JourneyLocationService journeyLocationService;

    @Test
    void getPublicLocationsForJourneyUsesActiveJourneyAndActiveLocationsOnly() {
        Journey activeJourney = Journey.builder()
                .id(7L)
                .title("Active journey")
                .status(JourneyStatus.ACTIVE)
                .build();
        Location activeLocation = Location.builder()
                .id(9L)
                .title("Visible location")
                .latitude(59.0)
                .longitude(24.0)
                .status(LocationStatus.ACTIVE)
                .build();
        JourneyLocation journeyLocation = JourneyLocation.builder()
                .id(11L)
                .journey(activeJourney)
                .location(activeLocation)
                .sortOrder(0)
                .build();
        JourneyLocationResponse response = JourneyLocationResponse.builder()
                .id(11L)
                .journeyId(7L)
                .locationId(9L)
                .title("Visible location")
                .build();

        when(journeyRepository.findByIdAndStatus(7L, JourneyStatus.ACTIVE)).thenReturn(Optional.of(activeJourney));
        when(journeyLocationRepository.findByJourneyIdAndLocationStatusOrderBySortOrderAsc(7L, LocationStatus.ACTIVE))
                .thenReturn(List.of(journeyLocation));
        when(journeyLocationMapper.toResponse(journeyLocation)).thenReturn(response);

        List<JourneyLocationResponse> locations = journeyLocationService.getPublicLocationsForJourney(7L);

        assertEquals(List.of(response), locations);
        verify(journeyRepository).findByIdAndStatus(7L, JourneyStatus.ACTIVE);
        verify(journeyLocationRepository).findByJourneyIdAndLocationStatusOrderBySortOrderAsc(7L, LocationStatus.ACTIVE);
    }

    @Test
    void getPublicLocationsForJourneyRejectsInactiveOrMissingJourney() {
        when(journeyRepository.findByIdAndStatus(7L, JourneyStatus.ACTIVE)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> journeyLocationService.getPublicLocationsForJourney(7L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(journeyRepository).findByIdAndStatus(7L, JourneyStatus.ACTIVE);
    }
}
