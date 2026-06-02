package com.explore.app.journeys.dto;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class JourneyRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createJourneyRejectsOutOfRangeCoordinatesStatusAndDistance() {
        JourneyCreateRequest request = JourneyCreateRequest.builder()
                .title("Forest Loop")
                .latitude(-91.0d)
                .longitude(181.0d)
                .distance(-1.0d)
                .status(4)
                .build();

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("latitude"));
        assertTrue(invalidFields.contains("longitude"));
        assertTrue(invalidFields.contains("distance"));
        assertTrue(invalidFields.contains("status"));
    }
}
