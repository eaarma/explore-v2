package com.explore.app.auth;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import com.explore.app.security.jwt.JwtService;
import com.explore.app.user.model.Role;
import com.explore.app.user.model.User;
import com.explore.app.user.model.UserStatus;
import com.explore.app.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "security.rate-limit.enabled=false")
@AutoConfigureMockMvc
@Transactional
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void successfulLoginReturnsBearerTokenAndUser() throws Exception {
        User user = createUser(
                "login-success-" + UUID.randomUUID() + "@example.com",
                "CorrectPass1!",
                UserStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "  %s  ",
                                  "password": "CorrectPass1!"
                                }
                                """.formatted(user.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value(user.getEmail()))
                .andExpect(jsonPath("$.user.name").value(user.getName()))
                .andExpect(jsonPath("$.user.role").value(user.getRole().name()))
                .andExpect(jsonPath("$.user.status").value(user.getStatus().name()));
    }

    @Test
    void loginRejectsBadPassword() throws Exception {
        User user = createUser(
                "login-bad-password-" + UUID.randomUUID() + "@example.com",
                "CorrectPass1!",
                UserStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "WrongPass1!"
                                }
                                """.formatted(user.getEmail())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRejectsInactiveUsers() throws Exception {
        User user = createUser(
                "login-inactive-" + UUID.randomUUID() + "@example.com",
                "CorrectPass1!",
                UserStatus.INACTIVE);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "CorrectPass1!"
                                }
                                """.formatted(user.getEmail())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerRejectsDuplicateEmail() throws Exception {
        User existingUser = createUser(
                "duplicate-" + UUID.randomUUID() + "@example.com",
                "CorrectPass1!",
                UserStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "  %s  ",
                                  "password": "AnotherPass1!",
                                  "name": "Duplicate User",
                                  "termsAccepted": true,
                                  "privacyPolicyAccepted": true
                                }
                                """.formatted(existingUser.getEmail().toUpperCase())))
                .andExpect(status().isConflict());
    }

    @Test
    void registerTrimsEmailAndSignupNameBeforeValidationAndPersistence() throws Exception {
        String rawEmail = "  register-trim-" + UUID.randomUUID() + "@example.com  ";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "TrimmedPass1!",
                                  "name": "  Trimmed Name  ",
                                  "termsAccepted": true,
                                  "privacyPolicyAccepted": true
                                }
                                """.formatted(rawEmail)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value(rawEmail.trim().toLowerCase()))
                .andExpect(jsonPath("$.user.name").value("Trimmed Name"))
                .andExpect(jsonPath("$.user.role").value(Role.USER.name()))
                .andExpect(jsonPath("$.user.status").value(UserStatus.ACTIVE.name()));
    }

    @Test
    void registerRejectsMissingLegalAcceptance() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "missing-legal-%s@example.com",
                                  "password": "LegalPass1!",
                                  "name": "Needs Acceptance",
                                  "termsAccepted": false,
                                  "privacyPolicyAccepted": true
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void currentUserEndpointReturnsUserForValidToken() throws Exception {
        User user = createUser(
                "me-valid-" + UUID.randomUUID() + "@example.com",
                "CorrectPass1!",
                UserStatus.ACTIVE);
        String token = generateToken(user);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.name").value(user.getName()))
                .andExpect(jsonPath("$.role").value(user.getRole().name()))
                .andExpect(jsonPath("$.status").value(user.getStatus().name()));
    }

    @Test
    void currentUserEndpointRejectsMissingToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void currentUserEndpointRejectsInvalidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void currentUserEndpointRejectsTokenForDeletedUser() throws Exception {
        User user = createUser(
                "me-deleted-" + UUID.randomUUID() + "@example.com",
                "CorrectPass1!",
                UserStatus.ACTIVE);
        String token = generateToken(user);

        userRepository.delete(user);
        userRepository.flush();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void currentUserEndpointRejectsTokenForInactiveUser() throws Exception {
        User user = createUser(
                "me-inactive-after-token-" + UUID.randomUUID() + "@example.com",
                "CorrectPass1!",
                UserStatus.ACTIVE);
        String token = generateToken(user);

        user.setStatus(UserStatus.INACTIVE);
        userRepository.saveAndFlush(user);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    private User createUser(String email, String rawPassword, UserStatus status) {
        return userRepository.saveAndFlush(User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .name("Auth Test User")
                .role(Role.USER)
                .status(status)
                .termsAccepted(true)
                .privacyPolicyAccepted(true)
                .termsAcceptedAt(Instant.parse("2026-06-03T00:00:00Z"))
                .privacyPolicyAcceptedAt(Instant.parse("2026-06-03T00:00:00Z"))
                .termsVersion("2026-05-31")
                .privacyPolicyVersion("2026-05-31")
                .build());
    }

    private String generateToken(User user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();
        return jwtService.generateToken(userDetails);
    }
}
