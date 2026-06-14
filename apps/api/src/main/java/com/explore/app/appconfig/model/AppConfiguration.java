package com.explore.app.appconfig.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "app_configuration")
public class AppConfiguration {

    public static final short GLOBAL_ID = 1;

    @Id
    @Builder.Default
    private Short id = GLOBAL_ID;

    @Column(nullable = false)
    private String appTitle;

    @Column(nullable = false)
    private String contactEmail;

    @Column(nullable = false)
    private String privacyPolicyVersion;

    @Column(nullable = false)
    private String termsVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode privacyPolicyDocument;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode termsDocument;

    @Column(name = "updated_by_user_id")
    private UUID updatedByUserId;

    @Column(name = "starter_data_seeded_at")
    private Instant starterDataSeededAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        if (id == null) {
            id = GLOBAL_ID;
        }

        if (appTitle != null) {
            appTitle = appTitle.trim();
        }

        if (contactEmail != null) {
            contactEmail = contactEmail.trim();
        }

        if (privacyPolicyVersion != null) {
            privacyPolicyVersion = privacyPolicyVersion.trim();
        }

        if (termsVersion != null) {
            termsVersion = termsVersion.trim();
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        if (appTitle != null) {
            appTitle = appTitle.trim();
        }

        if (contactEmail != null) {
            contactEmail = contactEmail.trim();
        }

        if (privacyPolicyVersion != null) {
            privacyPolicyVersion = privacyPolicyVersion.trim();
        }

        if (termsVersion != null) {
            termsVersion = termsVersion.trim();
        }

        updatedAt = Instant.now();
    }
}
