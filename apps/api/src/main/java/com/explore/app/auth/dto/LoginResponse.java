package com.explore.app.auth.dto;

import com.explore.app.user.dto.UserResponse;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String accessToken;
    private String tokenType;
    private UserResponse user;
}


