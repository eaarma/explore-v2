package com.explore.app.locations.dto;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class LocationRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createLocationRejectsOutOfRangeCoordinatesAndStatus() {
        LocationCreateRequest request = LocationCreateRequest.builder()
                .title("Cliff Walk")
                .latitude(91.0d)
                .longitude(-181.0d)
                .status(7)
                .build();

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("latitude"));
        assertTrue(invalidFields.contains("longitude"));
        assertTrue(invalidFields.contains("status"));
    }

    @Test
    void updateLocationRejectsNegativeExperienceAndDifficulty() {
        LocationUpdateRequest request = LocationUpdateRequest.builder()
                .experience(-1)
                .difficulty(-2)
                .build();

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("experience"));
        assertTrue(invalidFields.contains("difficulty"));
    }
}
