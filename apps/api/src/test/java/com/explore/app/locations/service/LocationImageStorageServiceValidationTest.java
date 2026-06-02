package com.explore.app.locations.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;

import java.util.Base64;
import java.util.List;

import com.explore.app.shared.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class LocationImageStorageServiceValidationTest {

    private static final byte[] PNG_BYTES = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8b8AAAAASUVORK5CYII=");

    private final LocationImageStorageService locationImageStorageService =
            new LocationImageStorageService("bucket", "locations", "", "");

    @Test
    void validateLocationStoragePathAcceptsPathsUnderTheLocationPrefix() {
        String storagePath =
                locationImageStorageService.validateLocationStoragePath(42L, "locations/42/1234-image.jpg");

        assertEquals("locations/42/1234-image.jpg", storagePath);
    }

    @Test
    void validateLocationStoragePathRejectsCrossLocationPaths() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> locationImageStorageService.validateLocationStoragePath(42L, "locations/99/1234-image.jpg"));

        assertEquals("Storage path does not belong to this location", exception.getMessage());
    }

    @Test
    void validateLocationStoragePathRejectsTraversalLikePaths() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> locationImageStorageService.validateLocationStoragePath(42L, "locations/42/../other/image.jpg"));

        assertEquals("Storage path is invalid", exception.getMessage());
    }

    @Test
    void validateLocationStoragePathsRejectsInvalidEntriesBeforeDeletion() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> locationImageStorageService.validateLocationStoragePaths(
                        42L,
                        List.of("locations/42/ok.jpg", "locations/7/not-allowed.jpg")));

        assertEquals("Storage path does not belong to this location", exception.getMessage());
    }

    @Test
    void validateUploadFileAcceptsRealImageContent() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.png",
                "image/png",
                PNG_BYTES);

        LocationImageStorageService.ValidatedLocationImageUpload validatedUpload =
                locationImageStorageService.validateUploadFile(file);

        assertArrayEquals(PNG_BYTES, validatedUpload.bytes());
        assertEquals("image/png", validatedUpload.contentType());
        assertEquals("png", validatedUpload.fileExtension());
    }

    @Test
    void validateUploadFileRejectsNonImageContentEvenWhenMimeTypeClaimsImage() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.png",
                "image/png",
                "not-an-image".getBytes());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> locationImageStorageService.validateUploadFile(file));

        assertEquals("Uploaded file is not a supported image", exception.getMessage());
    }

    @Test
    void validateUploadFileRejectsMimeTypeThatDoesNotMatchTheActualImage() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.jpg",
                "image/jpeg",
                PNG_BYTES);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> locationImageStorageService.validateUploadFile(file));

        assertEquals("Image content type does not match the uploaded file", exception.getMessage());
    }
}
