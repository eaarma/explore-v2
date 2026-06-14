package com.explore.app.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import com.explore.app.appconfig.mapper.AppConfigurationMapper;
import com.explore.app.appconfig.model.AppConfiguration;
import com.explore.app.appconfig.repository.AppConfigurationRepository;
import com.explore.app.auth.dto.LoginResponse;
import com.explore.app.auth.dto.RegisterRequest;
import com.explore.app.security.jwt.JwtService;
import com.explore.app.user.dto.UserResponse;
import com.explore.app.user.mapper.UserMapper;
import com.explore.app.user.model.Role;
import com.explore.app.user.model.User;
import com.explore.app.user.model.UserStatus;
import com.explore.app.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AppConfigurationRepository appConfigurationRepository;

    @Mock
    private AppConfigurationMapper appConfigurationMapper;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerPersistsNormalizedUserWithConfiguredLegalVersions() {
        RegisterRequest request = RegisterRequest.builder()
                .email("  New.User@Example.com  ")
                .password("StrongPass1!")
                .name("  New User  ")
                .termsAccepted(true)
                .privacyPolicyAccepted(true)
                .build();
        UserResponse mappedUser = UserResponse.builder()
                .email("new.user@example.com")
                .name("New User")
                .role(Role.USER)
                .status(UserStatus.ACTIVE)
                .build();
        AppConfiguration appConfiguration = AppConfiguration.builder()
                .privacyPolicyVersion("2026-06-14")
                .termsVersion("2026-06-15")
                .build();

        when(appConfigurationRepository.findGlobal()).thenReturn(Optional.of(appConfiguration));
        when(userRepository.existsByEmail("new.user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass1!")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenReturn(mappedUser);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");

        Instant beforeRegistration = Instant.now();
        LoginResponse response = authService.register(request);
        Instant afterRegistration = Instant.now();

        ArgumentCaptor<User> savedUserCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUserCaptor.capture());

        User savedUser = savedUserCaptor.getValue();
        assertEquals("new.user@example.com", savedUser.getEmail());
        assertEquals("New User", savedUser.getName());
        assertEquals("encoded-password", savedUser.getPassword());
        assertEquals(Role.USER, savedUser.getRole());
        assertEquals(UserStatus.ACTIVE, savedUser.getStatus());
        assertTrue(savedUser.isTermsAccepted());
        assertTrue(savedUser.isPrivacyPolicyAccepted());
        assertNotNull(savedUser.getTermsAcceptedAt());
        assertNotNull(savedUser.getPrivacyPolicyAcceptedAt());
        assertEquals(savedUser.getTermsAcceptedAt(), savedUser.getPrivacyPolicyAcceptedAt());
        assertTrue(!savedUser.getTermsAcceptedAt().isBefore(beforeRegistration));
        assertTrue(!savedUser.getTermsAcceptedAt().isAfter(afterRegistration));
        assertEquals("2026-06-15", savedUser.getTermsVersion());
        assertEquals("2026-06-14", savedUser.getPrivacyPolicyVersion());

        verify(userRepository).existsByEmail("new.user@example.com");
        verify(appConfigurationRepository).findGlobal();

        assertEquals("jwt-token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertSame(mappedUser, response.getUser());
    }

    @Test
    void registerFallsBackToDefaultLegalVersionsWhenConfigurationRowIsMissing() {
        RegisterRequest request = RegisterRequest.builder()
                .email("fallback@example.com")
                .password("StrongPass1!")
                .name("Fallback User")
                .termsAccepted(true)
                .privacyPolicyAccepted(true)
                .build();
        AppConfiguration defaultConfiguration = AppConfiguration.builder()
                .privacyPolicyVersion("2026-05-31")
                .termsVersion("2026-05-31")
                .build();

        when(appConfigurationRepository.findGlobal()).thenReturn(Optional.empty());
        when(appConfigurationMapper.createDefaultEntity()).thenReturn(defaultConfiguration);
        when(userRepository.existsByEmail("fallback@example.com")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass1!")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenReturn(UserResponse.builder().build());
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");

        authService.register(request);

        ArgumentCaptor<User> savedUserCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUserCaptor.capture());

        User savedUser = savedUserCaptor.getValue();
        assertEquals("2026-05-31", savedUser.getTermsVersion());
        assertEquals("2026-05-31", savedUser.getPrivacyPolicyVersion());
        verify(appConfigurationMapper).createDefaultEntity();
    }
}
