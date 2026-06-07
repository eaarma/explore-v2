import { apiClient } from "@/src/shared/api/apiClient";

const ADMIN_DATABASE_BACKUP_BASE_PATH = "/admin/system/database-backup";

export type AdminDatabaseBackupStatus = {
  schedulerEnabled: boolean;
  configured: boolean;
  running: boolean;
  retentionDays: number;
  bucketName: string | null;
  prefix: string | null;
  scheduleCron: string | null;
  scheduleZone: string | null;
  configurationError: string | null;
  lastTriggerSource: string | null;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastSucceededAt: string | null;
  lastBackupUri: string | null;
  lastError: string | null;
};

export async function getAdminDatabaseBackupStatus(): Promise<AdminDatabaseBackupStatus> {
  const response = await apiClient.get<AdminDatabaseBackupStatus>(
    ADMIN_DATABASE_BACKUP_BASE_PATH,
  );
  return response.data;
}

export async function triggerAdminDatabaseBackup(): Promise<AdminDatabaseBackupStatus> {
  const response = await apiClient.post<AdminDatabaseBackupStatus>(
    `${ADMIN_DATABASE_BACKUP_BASE_PATH}/run`,
  );
  return response.data;
}
