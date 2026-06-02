package com.explore.app.user.controller;

import com.explore.app.user.service.UserService;
import com.explore.app.user.dto.CreateUserRequest;
import com.explore.app.user.dto.UpdateUserRequest;
import com.explore.app.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable("id") UUID id) {
        return userService.getUserById(id);
    }

    @PatchMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }
}





