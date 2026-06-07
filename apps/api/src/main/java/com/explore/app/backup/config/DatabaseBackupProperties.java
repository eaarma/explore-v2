package com.explore.app.backup.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "backup")
@Getter
@Setter
public class DatabaseBackupProperties {

    private final Scheduler scheduler = new Scheduler();
    private final Database database = new Database();
    private int retentionDays = 14;
    private String firebaseStorageBucket;
    private String firebasePrefix = "backups/postgres";
    private String filePrefix = "explore-app-postgres";
    private String outputDirectory =
            System.getProperty("java.io.tmpdir") + "/explore-db-backups";
    private String pgDumpCommand = "pg_dump";

    @Getter
    @Setter
    public static class Scheduler {
        private boolean enabled;
        private String cron = "0 15 0 * * *";
        private String zone = "UTC";
    }

    @Getter
    @Setter
    public static class Database {
        private String host;
        private String port;
        private String name;
        private String user;
        private String password;
    }
}
