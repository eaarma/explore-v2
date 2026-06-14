import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  getAdminDatabaseBackupStatus,
  triggerAdminDatabaseBackup,
  type AdminDatabaseBackupStatus,
} from "@/src/features/admin/api/adminDatabaseBackupApi";
import { type AdminColors } from "@/src/features/admin/utils/adminScreenTheme";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";

type AdminOperationsSectionProps = {
  colors: AdminColors;
};

export function AdminOperationsSection({
  colors,
}: AdminOperationsSectionProps) {
  const [backupStatus, setBackupStatus] =
    useState<AdminDatabaseBackupStatus | null>(null);
  const [backupStatusError, setBackupStatusError] = useState<string | null>(
    null,
  );
  const [isLoadingBackupStatus, setIsLoadingBackupStatus] = useState(false);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBackupStatus() {
      setIsLoadingBackupStatus(true);

      try {
        const nextBackupStatus = await getAdminDatabaseBackupStatus();

        if (!isMounted) {
          return;
        }

        setBackupStatus(nextBackupStatus);
        setBackupStatusError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setBackupStatusError(
          getApiErrorMessage(
            error,
            "Could not load database backup status right now.",
          ),
        );
      } finally {
        if (isMounted) {
          setIsLoadingBackupStatus(false);
        }
      }
    }

    void loadBackupStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (backupStatus?.running !== true) {
      return;
    }

    let isMounted = true;
    const intervalId = setInterval(() => {
      void (async () => {
        try {
          const nextBackupStatus = await getAdminDatabaseBackupStatus();

          if (!isMounted) {
            return;
          }

          setBackupStatus(nextBackupStatus);
          setBackupStatusError(null);
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setBackupStatusError(
            getApiErrorMessage(
              error,
              "Could not load database backup status right now.",
            ),
          );
        }
      })();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [backupStatus?.running]);

  async function handleRefreshStatus(showLoading = false) {
    if (showLoading) {
      setIsLoadingBackupStatus(true);
    }

    try {
      const nextBackupStatus = await getAdminDatabaseBackupStatus();
      setBackupStatus(nextBackupStatus);
      setBackupStatusError(null);
    } catch (error) {
      setBackupStatusError(
        getApiErrorMessage(
          error,
          "Could not load database backup status right now.",
        ),
      );
    } finally {
      if (showLoading) {
        setIsLoadingBackupStatus(false);
      }
    }
  }

  async function handleTriggerBackup() {
    try {
      setIsTriggeringBackup(true);

      const nextBackupStatus = await triggerAdminDatabaseBackup();
      setBackupStatus(nextBackupStatus);
      setBackupStatusError(null);

      showAppToast({
        text: nextBackupStatus.running
          ? "Database backup started."
          : "Database backup request received.",
        tone: "success",
      });
    } catch (error) {
      showAppToast({
        text: getApiErrorMessage(
          error,
          "Could not start the database backup right now.",
        ),
        tone: "error",
      });
    } finally {
      setIsTriggeringBackup(false);
    }
  }

  return (
    <View style={styles.layout}>
      <View
        style={[
          styles.introCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          Operations
        </Text>
        <Text style={[styles.title, { color: colors.title }]}>
          Maintenance controls
        </Text>
        <Text style={[styles.description, { color: colors.body }]}>
          Review backend operational state, trigger manual maintenance actions,
          and keep the backup tooling in one dedicated admin page.
        </Text>
      </View>

      <View
        style={[
          styles.contentCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          Database backup
        </Text>
        <Text style={[styles.title, { color: colors.title }]}>
          Database backup control
        </Text>
        <Text style={[styles.description, { color: colors.body }]}>
          Review backup scheduling, trigger a manual database dump, and check
          the last upload state from the backend.
        </Text>

        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: colors.subtleAccent,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.previewTitle, { color: colors.title }]}>
            {buildBackupHeadline(
              backupStatus,
              isLoadingBackupStatus && backupStatus === null,
            )}
          </Text>
          <Text style={[styles.previewBody, { color: colors.body }]}>
            {buildBackupSummary(backupStatus)}
          </Text>
          <Text style={[styles.previewHint, { color: colors.body }]}>
            {backupStatus?.configurationError ??
              "Manual runs and scheduled runs both execute from the backend on the VPS."}
          </Text>
        </View>

        {backupStatusError ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.subtleAccent,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: "#B91C1C" }]}>
              {backupStatusError}
            </Text>
          </View>
        ) : null}

        {backupStatus ? (
          <View style={styles.metadataGrid}>
            <MetadataCard
              colors={colors}
              label="Scheduler"
              value={backupStatus.schedulerEnabled ? "Enabled" : "Disabled"}
            />
            <MetadataCard
              colors={colors}
              label="Running"
              value={backupStatus.running ? "Yes" : "No"}
            />
            <MetadataCard
              colors={colors}
              label="Configured"
              value={backupStatus.configured ? "Ready" : "Missing config"}
            />
            <MetadataCard
              colors={colors}
              label="Retention"
              value={`${backupStatus.retentionDays} days`}
            />
            <MetadataCard
              colors={colors}
              label="Bucket"
              value={backupStatus.bucketName || "Not set"}
            />
            <MetadataCard
              colors={colors}
              label="Prefix"
              value={backupStatus.prefix || "Root"}
            />
            <MetadataCard
              colors={colors}
              label="Last trigger"
              value={formatBackupSource(backupStatus.lastTriggerSource)}
            />
            <MetadataCard
              colors={colors}
              label="Last success"
              value={formatBackupDateTime(backupStatus.lastSucceededAt)}
            />
            <MetadataCard
              colors={colors}
              label="Last started"
              value={formatBackupDateTime(backupStatus.lastStartedAt)}
            />
            <MetadataCard
              colors={colors}
              label="Last completed"
              value={formatBackupDateTime(backupStatus.lastCompletedAt)}
            />
          </View>
        ) : null}

        {backupStatus?.lastBackupUri ? (
          <View
            style={[
              styles.inlineNoteCard,
              {
                backgroundColor: colors.menuBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: colors.body }]}>
              Last backup URI
            </Text>
            <Text style={[styles.inlineNoteText, { color: colors.title }]}>
              {backupStatus.lastBackupUri}
            </Text>
          </View>
        ) : null}

        {backupStatus?.lastError ? (
          <View
            style={[
              styles.inlineNoteCard,
              {
                backgroundColor: colors.menuBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: "#B91C1C" }]}>
              Last backup error
            </Text>
            <Text style={[styles.errorText, { color: "#B91C1C" }]}>
              {backupStatus.lastError}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={
              backupStatus === null ||
              isLoadingBackupStatus ||
              isTriggeringBackup ||
              backupStatus.running ||
              backupStatus.configured === false
            }
            onPress={() => void handleTriggerBackup()}
            style={({ pressed }) => [
              styles.primaryAction,
              {
                backgroundColor: colors.accent,
              },
              pressed && styles.actionPressed,
              (backupStatus === null ||
                isLoadingBackupStatus ||
                isTriggeringBackup ||
                backupStatus?.running === true ||
                backupStatus?.configured === false) &&
                styles.actionDisabled,
            ]}
          >
            <Text style={styles.primaryActionText}>
              {isTriggeringBackup
                ? "Starting..."
                : backupStatus?.running
                  ? "Backup running..."
                  : "Run backup now"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isLoadingBackupStatus}
            onPress={() => void handleRefreshStatus(true)}
            style={({ pressed }) => [
              styles.secondaryAction,
              {
                backgroundColor: colors.menuBackground,
                borderColor: colors.cardBorder,
              },
              pressed && styles.actionPressed,
              isLoadingBackupStatus && styles.actionDisabled,
            ]}
          >
            <Text
              style={[
                styles.secondaryActionText,
                { color: colors.title },
              ]}
            >
              {isLoadingBackupStatus ? "Refreshing..." : "Refresh status"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MetadataCard({
  colors,
  label,
  value,
}: {
  colors: AdminColors;
  label: string;
  value: string;
}) {
  return (
    <View
      style={[
        styles.metadataCard,
        {
          backgroundColor: colors.menuBackground,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.metadataLabel, { color: colors.body }]}>
        {label}
      </Text>
      <Text style={[styles.metadataValue, { color: colors.title }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    gap: 18,
  },
  introCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  contentCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  secondaryAction: {
    minHeight: 48,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryAction: {
    minHeight: 48,
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  metadataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metadataCard: {
    minWidth: 150,
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  inlineNoteCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  inlineNoteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

function buildBackupHeadline(
  backupStatus: AdminDatabaseBackupStatus | null,
  isLoading: boolean,
) {
  if (isLoading) {
    return "Loading backup status";
  }

  if (!backupStatus) {
    return "Backup status unavailable";
  }

  if (backupStatus.running) {
    return "Backup in progress";
  }

  if (backupStatus.lastSucceededAt) {
    return "Last backup succeeded";
  }

  if (backupStatus.lastError) {
    return "Last backup failed";
  }

  return "Ready for the first backup";
}

function buildBackupSummary(backupStatus: AdminDatabaseBackupStatus | null) {
  if (!backupStatus) {
    return "Open this section to fetch the backend backup state and controls.";
  }

  if (backupStatus.running) {
    return "The backend is creating a PostgreSQL dump and uploading it to Firebase Storage.";
  }

  if (backupStatus.lastSucceededAt) {
    return `Last success: ${formatBackupDateTime(backupStatus.lastSucceededAt)}.`;
  }

  if (backupStatus.lastError) {
    return "The previous backup attempt ended with an error. Review the message below before retrying.";
  }

  return "No successful backup has been recorded yet.";
}

function formatBackupSource(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase() ?? "";

  if (normalizedValue === "MANUAL") {
    return "Manual";
  }

  if (normalizedValue === "SCHEDULED") {
    return "Scheduled";
  }

  return "Not yet run";
}

function formatBackupDateTime(value: string | null | undefined) {
  const parsedDate = typeof value === "string" ? new Date(value) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
