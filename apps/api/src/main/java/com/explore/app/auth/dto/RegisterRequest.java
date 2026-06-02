package com.explore.app.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank
    @Email
    @Size(max = 320)
    private String email;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    @NotBlank
    @Size(max = 150)
    private String name;

    private boolean termsAccepted;

    private boolean privacyPolicyAccepted;

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim();
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public String getNormalizedEmail() {
        return email == null ? null : email.trim().toLowerCase();
    }

    public String getNormalizedName() {
        return name == null ? null : name.trim();
    }
}


