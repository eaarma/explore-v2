package com.explore.app.backup.service;

import com.explore.app.backup.config.DatabaseBackupProperties;
import com.explore.app.backup.dto.DatabaseBackupStatusResponse;
import com.explore.app.shared.BadRequestException;
import com.google.api.gax.paging.Page;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.WriteChannel;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.channels.Channels;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class DatabaseBackupService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBackupService.class);
    private static final DateTimeFormatter BACKUP_TIMESTAMP_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm-ss'Z'", Locale.ROOT)
                    .withZone(ZoneOffset.UTC);

    private final DatabaseBackupProperties properties;
    private final String datasourceUrl;
    private final String serviceAccountPath;
    private final String serviceAccountBase64;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final Object stateMonitor = new Object();
    private final Object storageMonitor = new Object();
    private final ExecutorService backupExecutor = Executors.newSingleThreadExecutor(
            new BackupThreadFactory());

    private volatile Storage storage;
    private volatile Instant lastStartedAt;
    private volatile Instant lastCompletedAt;
    private volatile Instant lastSucceededAt;
    private volatile String lastBackupUri;
    private volatile String lastError;
    private volatile BackupTriggerSource lastTriggerSource;

    public DatabaseBackupService(
            DatabaseBackupProperties properties,
            @Value("${spring.datasource.url:}") String datasourceUrl,
            @Value("${firebase.storage.service-account-path:${FIREBASE_SERVICE_ACCOUNT_PATH:${GOOGLE_APPLICATION_CREDENTIALS:}}}") String serviceAccountPath,
            @Value("${firebase.storage.service-account-base64:${FIREBASE_SERVICE_ACCOUNT_BASE64:}}") String serviceAccountBase64) {
        this.properties = properties;
        this.datasourceUrl = normalizeOptional(datasourceUrl);
        this.serviceAccountPath = normalizeOptional(serviceAccountPath);
        this.serviceAccountBase64 = normalizeOptional(serviceAccountBase64);
    }

    public DatabaseBackupStatusResponse getStatus() {
        BackupConfiguration configuration = resolveConfiguration();

        synchronized (stateMonitor) {
            return DatabaseBackupStatusResponse.builder()
                    .schedulerEnabled(properties.getScheduler().isEnabled())
                    .configured(configuration.configured())
                    .running(running.get())
                    .retentionDays(properties.getRetentionDays())
                    .bucketName(configuration.bucketName())
                    .prefix(configuration.prefix())
                    .scheduleCron(properties.getScheduler().getCron())
                    .scheduleZone(properties.getScheduler().getZone())
                    .configurationError(configuration.configurationError())
                    .lastTriggerSource(lastTriggerSource != null ? lastTriggerSource.name() : null)
                    .lastStartedAt(lastStartedAt)
                    .lastCompletedAt(lastCompletedAt)
                    .lastSucceededAt(lastSucceededAt)
                    .lastBackupUri(lastBackupUri)
                    .lastError(lastError)
                    .build();
        }
    }

    public DatabaseBackupStatusResponse triggerManualBackup() {
        BackupConfiguration configuration = resolveConfiguration();

        if (!configuration.configured()) {
            throw new BadRequestException(configuration.configurationError());
        }

        startBackup(configuration, BackupTriggerSource.MANUAL, true);
        return getStatus();
    }

    @Scheduled(
            cron = "${backup.scheduler.cron:0 15 0 * * *}",
            zone = "${backup.scheduler.zone:UTC}")
    public void scheduleBackupIfEnabled() {
        if (!properties.getScheduler().isEnabled()) {
            return;
        }

        BackupConfiguration configuration = resolveConfiguration();
        if (!configuration.configured()) {
            log.warn("Skipping scheduled database backup because configuration is incomplete: {}",
                    configuration.configurationError());
            return;
        }

        startBackup(configuration, BackupTriggerSource.SCHEDULED, false);
    }

    @PreDestroy
    void shutdownExecutor() {
        backupExecutor.shutdownNow();
    }

    private void startBackup(
            BackupConfiguration configuration,
            BackupTriggerSource source,
            boolean failIfAlreadyRunning) {
        if (!running.compareAndSet(false, true)) {
            if (failIfAlreadyRunning) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A database backup is already running.");
            }

            log.info("Skipping {} database backup request because a backup is already running.",
                    source.name().toLowerCase(Locale.ROOT));
            return;
        }

        synchronized (stateMonitor) {
            lastTriggerSource = source;
            lastStartedAt = Instant.now();
            lastError = null;
        }

        backupExecutor.execute(() -> executeBackup(configuration, source));
    }

    private void executeBackup(BackupConfiguration configuration, BackupTriggerSource source) {
        Path localBackupPath = null;

        try {
            DatabaseConnectionSettings databaseSettings =
                    resolveDatabaseConnectionSettings(configuration.databaseSettings());
            Path outputDirectory = Path.of(configuration.outputDirectory());
            Files.createDirectories(outputDirectory);

            String backupFileName = buildBackupFileName(configuration.filePrefix());
            localBackupPath = outputDirectory.resolve(backupFileName);

            runPgDump(localBackupPath, databaseSettings, configuration.pgDumpCommand());

            String objectName = buildObjectName(configuration.prefix(), backupFileName);
            String backupUri = uploadBackup(localBackupPath, configuration.bucketName(), objectName);
            pruneExpiredBackups(configuration.bucketName(), configuration.prefix(), configuration.retentionDays());

            synchronized (stateMonitor) {
                Instant completedAt = Instant.now();
                lastCompletedAt = completedAt;
                lastSucceededAt = completedAt;
                lastBackupUri = backupUri;
                lastError = null;
            }

            log.info("Completed {} database backup and uploaded {}.",
                    source.name().toLowerCase(Locale.ROOT), backupUri);
        } catch (Exception exception) {
            log.error("Database backup failed.", exception);

            synchronized (stateMonitor) {
                lastCompletedAt = Instant.now();
                lastError = buildBackupFailureMessage(exception);
            }
        } finally {
            running.set(false);

            if (localBackupPath != null) {
                try {
                    Files.deleteIfExists(localBackupPath);
                } catch (IOException exception) {
                    log.warn("Could not delete temporary database backup file {}.",
                            localBackupPath, exception);
                }
            }
        }
    }

    private void runPgDump(
            Path localBackupPath,
            DatabaseConnectionSettings databaseSettings,
            String pgDumpCommand) throws IOException, InterruptedException {
        List<String> command = List.of(
                pgDumpCommand,
                "--host=" + databaseSettings.host(),
                "--port=" + databaseSettings.port(),
                "--username=" + databaseSettings.user(),
                "--dbname=" + databaseSettings.databaseName(),
                "--format=custom",
                "--compress=9",
                "--no-owner",
                "--no-privileges",
                "--file=" + localBackupPath);

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        processBuilder.environment().put("PGPASSWORD", databaseSettings.password());

        Process process = processBuilder.start();

        String processOutput;
        try (InputStream inputStream = process.getInputStream()) {
            processOutput = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8).trim();
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IllegalStateException(
                    processOutput.isEmpty()
                            ? "pg_dump exited with code " + exitCode + "."
                            : "pg_dump failed: " + processOutput);
        }
    }

    private String uploadBackup(Path localBackupPath, String bucketName, String objectName)
            throws IOException {
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucketName, objectName))
                .setContentType("application/octet-stream")
                .build();

        try (WriteChannel writeChannel = getStorage().writer(blobInfo);
             InputStream inputStream = Files.newInputStream(localBackupPath);
             OutputStream outputStream = Channels.newOutputStream(writeChannel)) {
            inputStream.transferTo(outputStream);
        }

        return "gs://" + bucketName + "/" + objectName;
    }

    private void pruneExpiredBackups(String bucketName, String prefix, int retentionDays) {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        String normalizedPrefix = normalizeStoragePrefix(prefix);
        String listPrefix = normalizedPrefix.isEmpty() ? "" : normalizedPrefix + "/";

        Page<Blob> blobs = getStorage().list(
                bucketName,
                Storage.BlobListOption.prefix(listPrefix));

        for (Blob blob : blobs.iterateAll()) {
            if (blob == null || !StringUtils.hasText(blob.getName())) {
                continue;
            }

            long updatedAt = blob.getUpdateTime();
            if (updatedAt <= 0L) {
                continue;
            }

            if (Instant.ofEpochMilli(updatedAt).isBefore(cutoff)) {
                getStorage().delete(bucketName, blob.getName());
            }
        }
    }

    private Storage getStorage() {
        if (storage != null) {
            return storage;
        }

        synchronized (storageMonitor) {
            if (storage == null) {
                storage = StorageOptions.newBuilder()
                        .setCredentials(resolveCredentials())
                        .build()
                        .getService();
            }
        }

        return storage;
    }

    private GoogleCredentials resolveCredentials() {
        try {
            if (serviceAccountBase64 != null) {
                byte[] decoded = Base64.getDecoder().decode(serviceAccountBase64);
                return GoogleCredentials.fromStream(new ByteArrayInputStream(decoded));
            }

            if (serviceAccountPath != null) {
                try (InputStream inputStream = Files.newInputStream(Path.of(serviceAccountPath))) {
                    return GoogleCredentials.fromStream(inputStream);
                }
            }

            throw new IllegalStateException(
                    "Firebase credentials must be configured with FIREBASE_SERVICE_ACCOUNT_PATH, "
                            + "FIREBASE_SERVICE_ACCOUNT_BASE64, or GOOGLE_APPLICATION_CREDENTIALS.");
        } catch (IOException exception) {
            throw new IllegalStateException("Could not initialize Firebase credentials for backups.",
                    exception);
        }
    }

    private BackupConfiguration resolveConfiguration() {
        List<String> missing = new ArrayList<>();
        DatabaseConnectionSettings databaseSettings = resolveDatabaseConnectionSettingsOrNull();
        String bucketName = normalizeOptional(properties.getFirebaseStorageBucket());
        String prefix = normalizeStoragePrefix(properties.getFirebasePrefix());
        String filePrefix = normalizeOptional(properties.getFilePrefix());
        String outputDirectory = normalizeOptional(properties.getOutputDirectory());
        String pgDumpCommand = normalizeOptional(properties.getPgDumpCommand());

        if (databaseSettings == null) {
            missing.add("database connection settings");
        }

        if (!StringUtils.hasText(bucketName)) {
            missing.add("backup Firebase Storage bucket");
        }

        if (!hasFirebaseCredentials()) {
            missing.add("Firebase service account credentials");
        }

        if (!StringUtils.hasText(filePrefix)) {
            missing.add("backup file prefix");
        }

        if (!StringUtils.hasText(outputDirectory)) {
            missing.add("backup output directory");
        }

        if (!StringUtils.hasText(pgDumpCommand)) {
            missing.add("pg_dump command");
        }

        String configurationError = missing.isEmpty()
                ? null
                : "Missing backup configuration: " + String.join(", ", missing) + ".";

        return new BackupConfiguration(
                missing.isEmpty(),
                configurationError,
                databaseSettings,
                bucketName,
                prefix,
                filePrefix,
                outputDirectory,
                pgDumpCommand,
                properties.getRetentionDays());
    }

    private DatabaseConnectionSettings resolveDatabaseConnectionSettings(
            DatabaseConnectionSettings databaseSettings) {
        if (databaseSettings == null) {
            throw new IllegalStateException("Database backup connection settings are not configured.");
        }

        return databaseSettings;
    }

    private DatabaseConnectionSettings resolveDatabaseConnectionSettingsOrNull() {
        JdbcConnectionParts jdbcConnectionParts = parseDatasourceUrl(datasourceUrl);

        String host = firstNonBlank(properties.getDatabase().getHost(), jdbcConnectionParts.host());
        int port = resolvePort(properties.getDatabase().getPort(), jdbcConnectionParts.port());
        String databaseName =
                firstNonBlank(properties.getDatabase().getName(), jdbcConnectionParts.databaseName());
        String user = normalizeOptional(properties.getDatabase().getUser());
        String password = normalizeOptional(properties.getDatabase().getPassword());

        if (!StringUtils.hasText(host)
                || !StringUtils.hasText(databaseName)
                || !StringUtils.hasText(user)
                || !StringUtils.hasText(password)) {
            return null;
        }

        return new DatabaseConnectionSettings(host, port, databaseName, user, password);
    }

    private JdbcConnectionParts parseDatasourceUrl(String value) {
        String normalizedValue = normalizeOptional(value);
        if (!StringUtils.hasText(normalizedValue)
                || !normalizedValue.startsWith("jdbc:postgresql://")) {
            return JdbcConnectionParts.empty();
        }

        try {
            URI uri = URI.create(normalizedValue.substring("jdbc:".length()));
            String path = normalizeOptional(uri.getPath());
            String databaseName = path != null && path.startsWith("/")
                    ? path.substring(1)
                    : path;

            return new JdbcConnectionParts(
                    normalizeOptional(uri.getHost()),
                    uri.getPort() > 0 ? uri.getPort() : null,
                    normalizeOptional(databaseName));
        } catch (IllegalArgumentException exception) {
            log.warn("Could not parse Spring datasource URL for database backup configuration.");
            return JdbcConnectionParts.empty();
        }
    }

    private int resolvePort(String configuredPort, Integer fallbackPort) {
        String normalizedPort = normalizeOptional(configuredPort);
        if (normalizedPort != null) {
            try {
                return Integer.parseInt(normalizedPort);
            } catch (NumberFormatException exception) {
                throw new BadRequestException("BACKUP_DATABASE_PORT must be a valid integer.");
            }
        }

        if (fallbackPort != null && fallbackPort > 0) {
            return fallbackPort;
        }

        return 5432;
    }

    private boolean hasFirebaseCredentials() {
        return StringUtils.hasText(serviceAccountBase64) || StringUtils.hasText(serviceAccountPath);
    }

    private String buildBackupFileName(String filePrefix) {
        return filePrefix + "-" + BACKUP_TIMESTAMP_FORMATTER.format(Instant.now()) + ".dump";
    }

    private String buildObjectName(String prefix, String fileName) {
        if (!StringUtils.hasText(prefix)) {
            return fileName;
        }

        return prefix + "/" + fileName;
    }

    private String normalizeStoragePrefix(String value) {
        String normalizedValue = normalizeOptional(value);
        if (normalizedValue == null) {
            return "";
        }

        String withoutLeadingSlash = normalizedValue.replaceAll("^/+", "");
        return withoutLeadingSlash.replaceAll("/+$", "");
    }

    private String buildBackupFailureMessage(Exception exception) {
        if (exception instanceof InterruptedException) {
            Thread.currentThread().interrupt();
            return "Database backup was interrupted.";
        }

        String message = exception.getMessage();
        if (!StringUtils.hasText(message)) {
            return "Database backup failed.";
        }

        return message.trim();
    }

    private String firstNonBlank(String primary, String fallback) {
        String normalizedPrimary = normalizeOptional(primary);
        if (normalizedPrimary != null) {
            return normalizedPrimary;
        }

        return normalizeOptional(fallback);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private record BackupConfiguration(
            boolean configured,
            String configurationError,
            DatabaseConnectionSettings databaseSettings,
            String bucketName,
            String prefix,
            String filePrefix,
            String outputDirectory,
            String pgDumpCommand,
            int retentionDays) {
    }

    private record DatabaseConnectionSettings(
            String host,
            int port,
            String databaseName,
            String user,
            String password) {
    }

    private record JdbcConnectionParts(
            String host,
            Integer port,
            String databaseName) {
        private static JdbcConnectionParts empty() {
            return new JdbcConnectionParts(null, null, null);
        }
    }

    private enum BackupTriggerSource {
        MANUAL,
        SCHEDULED
    }

    private static final class BackupThreadFactory implements ThreadFactory {

        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable, "database-backup-worker");
            thread.setDaemon(true);
            return thread;
        }
    }
}
