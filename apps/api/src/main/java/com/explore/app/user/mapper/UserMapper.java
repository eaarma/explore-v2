package com.explore.app.user.mapper;

import com.explore.app.user.model.User;
import com.explore.app.user.model.UserStatus;
import com.explore.app.user.dto.CreateUserRequest;
import com.explore.app.user.dto.UserResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(CreateUserRequest request) {
        return User.builder()
                .email(normalizeEmail(request.getEmail()))
                .name(normalizeName(request.getName()))
                .role(request.getRole())
                .status(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE)
                .build();
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }
}





