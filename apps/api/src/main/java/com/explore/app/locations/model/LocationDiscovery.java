package com.explore.app.locations.model;

import com.explore.app.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "location_discoveries", uniqueConstraints = {
        @UniqueConstraint(name = "uk_location_discovery_user_location", columnNames = { "user_id", "location_id" })
})
public class LocationDiscovery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "discovered_at", nullable = false)
    private Instant discoveredAt;

    private Double latitude;

    private Double longitude;

    @Column(name = "accuracy_meters")
    private Double accuracyMeters;

    @Column(name = "distance_meters")
    private Double distanceMeters;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationDiscoverySource source;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (discoveredAt == null) {
            discoveredAt = now;
        }
        if (createdAt == null) {
            createdAt = discoveredAt;
        }
    }
}
