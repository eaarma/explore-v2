package com.explore.app.journeys.mapper;

import com.explore.app.journeys.model.JourneyLocation;
import com.explore.app.journeys.dto.JourneyLocationResponse;
import com.explore.app.locations.mapper.LocationMapper;
import com.explore.app.locations.model.Location;
import com.explore.app.shared.CategoryNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JourneyLocationMapper {

    private final LocationMapper locationMapper;

    public JourneyLocationResponse toResponse(JourneyLocation journeyLocation) {
        Location location = journeyLocation.getLocation();

        return JourneyLocationResponse.builder()
                .id(journeyLocation.getId())
                .journeyId(journeyLocation.getJourney().getId())
                .locationId(location.getId())
                .title(location.getTitle())
                .description(location.getDescription())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .county(location.getCounty())
                .category(CategoryNormalizer.normalizeOptionalCategory(location.getCategory()))
                .imageUrl(locationMapper.resolvePrimaryImageUrl(location))
                .experience(location.getExperience())
                .difficulty(location.getDifficulty())
                .notes(location.getNotes())
                .status(location.getStatus().getCode())
                .sortOrder(journeyLocation.getSortOrder())
                .build();
    }
}





