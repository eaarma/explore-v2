package com.explore.app.status;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.shared.BadRequestException;
import org.junit.jupiter.api.Test;

class StatusCodeValidationTest {

    @Test
    void locationStatusRejectsUnknownCode() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> LocationStatus.fromCode(99));

        assertEquals("Invalid location status code: 99", exception.getMessage());
    }

    @Test
    void journeyStatusRejectsUnknownCode() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> JourneyStatus.fromCode(99));

        assertEquals("Invalid journey status code: 99", exception.getMessage());
    }
}
