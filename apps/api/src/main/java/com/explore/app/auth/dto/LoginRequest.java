package com.explore.app.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank
    @Email
    @Size(max = 320)
    private String email;

    @NotBlank
    @Size(max = 100)
    private String password;

    public String getNormalizedEmail() {
        return email == null ? null : email.trim().toLowerCase();
    }
}


