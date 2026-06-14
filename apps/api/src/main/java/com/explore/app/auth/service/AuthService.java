package com.explore.app.auth.service;

import com.explore.app.appconfig.mapper.AppConfigurationMapper;
import com.explore.app.appconfig.model.AppConfiguration;
import com.explore.app.appconfig.repository.AppConfigurationRepository;
import com.explore.app.auth.dto.LoginRequest;
import com.explore.app.auth.dto.LoginResponse;
import com.explore.app.auth.dto.RegisterRequest;
import com.explore.app.security.jwt.JwtService;
import com.explore.app.shared.BadRequestException;
import com.explore.app.user.model.Role;
import com.explore.app.user.model.User;
import com.explore.app.user.mapper.UserMapper;
import com.explore.app.user.repository.UserRepository;
import com.explore.app.user.model.UserStatus;
import com.explore.app.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final AppConfigurationRepository appConfigurationRepository;
    private final AppConfigurationMapper appConfigurationMapper;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        String email = request.getNormalizedEmail();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password", exception);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"));

        return buildAuthResponse(user);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        String email = request.getNormalizedEmail();
        Instant acceptedAt = Instant.now();
        AppConfiguration appConfiguration = resolveCurrentAppConfiguration();

        if (!request.isTermsAccepted() || !request.isPrivacyPolicyAccepted()) {
            throw new BadRequestException("Terms and Privacy Policy must be accepted.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getNormalizedName())
                .role(Role.USER)
                .status(UserStatus.ACTIVE)
                .termsAccepted(true)
                .privacyPolicyAccepted(true)
                .termsAcceptedAt(acceptedAt)
                .privacyPolicyAcceptedAt(acceptedAt)
                .termsVersion(appConfiguration.getTermsVersion())
                .privacyPolicyVersion(appConfiguration.getPrivacyPolicyVersion())
                .build();

        User savedUser = userRepository.save(user);
        return buildAuthResponse(savedUser);
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return userMapper.toResponse(user);
    }

    private LoginResponse buildAuthResponse(User user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String accessToken = jwtService.generateToken(userDetails);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    private AppConfiguration resolveCurrentAppConfiguration() {
        return appConfigurationRepository.findGlobal()
                .orElseGet(appConfigurationMapper::createDefaultEntity);
    }
}




