package com.explore.app.user.controller;

import com.explore.app.user.dto.CurrentUserUpdateRequest;
import com.explore.app.user.dto.UserResponse;
import com.explore.app.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class CurrentUserAccountController {

    private final UserService userService;

    @PatchMapping
    public UserResponse updateCurrentUser(
            Authentication authentication,
            @Valid @RequestBody CurrentUserUpdateRequest request) {
        return userService.updateCurrentUser(authentication.getName(), request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCurrentUser(Authentication authentication) {
        userService.deleteCurrentUser(authentication.getName());
    }
}
