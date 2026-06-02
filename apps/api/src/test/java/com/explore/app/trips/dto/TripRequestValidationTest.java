package com.explore.app.trips.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class TripRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createTripRequiresNonBlankBoundedName() {
        TripCreateRequest request = TripCreateRequest.builder()
                .name(" ")
                .description("Weekend plan")
                .build();

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("name"));
    }

    @Test
    void addLocationRequiresPositiveLocationId() {
        TripLocationAddRequest request = TripLocationAddRequest.builder()
                .locationId(0L)
                .build();

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("locationId"));
    }

    @Test
    void addJourneyRequiresPositiveJourneyId() {
        TripJourneyAddRequest request = TripJourneyAddRequest.builder()
                .journeyId(-3L)
                .build();

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("journeyId"));
    }

    @Test
    void reorderRequiresAtLeastOneValidItem() {
        TripReorderRequest request = TripReorderRequest.builder()
                .items(List.of(
                        TripReorderItemRequest.builder()
                                .kind("invalid")
                                .relationId(null)
                                .build()))
                .build();

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertEquals(Set.of("items[0].kind", "items[0].relationId"), invalidFields);
    }
}
