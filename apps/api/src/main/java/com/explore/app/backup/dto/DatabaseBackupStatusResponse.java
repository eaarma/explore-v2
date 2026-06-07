package com.explore.app.backup.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatabaseBackupStatusResponse {

    private boolean schedulerEnabled;
    private boolean configured;
    private boolean running;
    private int retentionDays;
    private String bucketName;
    private String prefix;
    private String scheduleCron;
    private String scheduleZone;
    private String configurationError;
    private String lastTriggerSource;
    private Instant lastStartedAt;
    private Instant lastCompletedAt;
    private Instant lastSucceededAt;
    private String lastBackupUri;
    private String lastError;
}
