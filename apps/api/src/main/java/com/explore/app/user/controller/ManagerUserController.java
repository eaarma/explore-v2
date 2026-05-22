package com.explore.app.user.controller;

import com.explore.app.user.service.UserService;
import com.explore.app.user.dto.UpdateUserRequest;
import com.explore.app.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager/users")
@RequiredArgsConstructor
public class ManagerUserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @PatchMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }
}





