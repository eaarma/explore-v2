package com.explore.app.user.dto;

import com.explore.app.user.model.Role;
import com.explore.app.user.model.UserStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID id;
    private String email;
    private String name;
    private Role role;
    private UserStatus status;
    private Instant createdAt;
}


