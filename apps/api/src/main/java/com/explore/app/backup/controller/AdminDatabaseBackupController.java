package com.explore.app.backup.controller;

import com.explore.app.backup.dto.DatabaseBackupStatusResponse;
import com.explore.app.backup.service.DatabaseBackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/system/database-backup")
@RequiredArgsConstructor
public class AdminDatabaseBackupController {

    private final DatabaseBackupService databaseBackupService;

    @GetMapping
    public DatabaseBackupStatusResponse getDatabaseBackupStatus() {
        return databaseBackupService.getStatus();
    }

    @PostMapping("/run")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public DatabaseBackupStatusResponse triggerDatabaseBackup() {
        return databaseBackupService.triggerManualBackup();
    }
}
