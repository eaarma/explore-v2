package com.explore.app.user.service;

import com.explore.app.user.mapper.UserMapper;
import com.explore.app.user.model.User;
import com.explore.app.user.repository.UserRepository;
import com.explore.app.user.dto.CreateUserRequest;
import com.explore.app.user.dto.CurrentUserUpdateRequest;
import com.explore.app.user.dto.UpdateUserRequest;
import com.explore.app.user.dto.UserResponse;
import com.explore.app.journeys.repository.JourneyCompletionRepository;
import com.explore.app.locations.repository.LocationDiscoveryRepository;
import com.explore.app.shared.NotFoundException;
import com.explore.app.trips.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final LocationDiscoveryRepository locationDiscoveryRepository;
    private final JourneyCompletionRepository journeyCompletionRepository;
    private final TripRepository tripRepository;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        User user = userMapper.toEntity(request);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateCurrentUser(String email, CurrentUserUpdateRequest request) {
        User user = findUserByEmail(email);
        user.setName(normalizeRequiredName(request.getName()));
        return userMapper.toResponse(user);
    }

    @Transactional
    public void deleteCurrentUser(String email) {
        User user = findUserByEmail(email);
        UUID userId = user.getId();

        tripRepository.deleteAll(tripRepository.findAllByUserId(userId));
        locationDiscoveryRepository.deleteAll(locationDiscoveryRepository.findByUserId(userId));
        journeyCompletionRepository.deleteAll(journeyCompletionRepository.findByUserId(userId));
        userRepository.delete(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        user.setName(normalizeRequiredName(request.getName()));
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());

        return userMapper.toResponse(user);
    }

    private User findUserByEmail(String email) {
        String normalizedEmail = normalizeRequiredEmail(email);

        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private String normalizeRequiredEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("User email is required");
        }

        return email.trim().toLowerCase();
    }

    private String normalizeRequiredName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("User name is required");
        }

        return name.trim();
    }
}





