package com.explore.app.locations.controller;

import com.explore.app.locations.dto.LocationImageUploadResponse;
import com.explore.app.locations.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/locations")
@RequiredArgsConstructor
public class AdminLocationImageController {

    private final LocationService locationService;

    @PostMapping(path = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public LocationImageUploadResponse uploadLocationImage(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestPart("file") MultipartFile file) {
        return locationService.uploadLocationImage(authentication.getName(), id, file);
    }

    @DeleteMapping("/{id}/images/temp")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePendingLocationImage(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestParam("storagePath") String storagePath) {
        locationService.deletePendingLocationImage(authentication.getName(), id, storagePath);
    }
}
