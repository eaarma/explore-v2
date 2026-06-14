# Database Backups

This project includes a backend-managed PostgreSQL backup flow that stores
compressed `pg_dump` artifacts in Firebase Storage and keeps the last `14` days
of backups by default.

## What runs on schedule

The backup scheduler now runs inside the backend on the VPS. That means it can
reach the private PostgreSQL container directly and does not depend on GitHub
Actions network access.

Each scheduled run does this:

1. execute `pg_dump` against the configured PostgreSQL database
2. write a compressed PostgreSQL custom-format dump to a temporary local file
3. upload the dump to `gs://<bucket>/backups/postgres/`
4. delete any backup objects older than the configured retention window

Default schedule configuration:

- `BACKUP_SCHEDULER_ENABLED=true` in production
- `BACKUP_SCHEDULER_CRON=0 15 0 * * *`
- `BACKUP_SCHEDULER_ZONE=UTC`

That preserves the old `00:15 UTC` timing unless you override it.

## Required backend environment

Configure these backend environment variables on the VPS:

- `BACKUP_SCHEDULER_ENABLED`
- `BACKUP_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_SERVICE_ACCOUNT_BASE64` or `FIREBASE_SERVICE_ACCOUNT_PATH`

Usually you do not need separate backup database credentials because the backup
service can reuse the main Spring datasource settings. If needed, these
override values are available:

- `BACKUP_DATABASE_HOST`
- `BACKUP_DATABASE_PORT`
- `BACKUP_DATABASE_NAME`
- `BACKUP_DATABASE_USER`
- `BACKUP_DATABASE_PASSWORD`

`FIREBASE_SERVICE_ACCOUNT_BASE64` should be the base64-encoded contents of a
Google service account JSON file with permission to create, list, and delete
objects in the backup bucket.

## Backup file format

Backups are created with:

- `pg_dump --format=custom --compress=9 --no-owner --no-privileges`

That means each backup is already compressed and is suitable for later restore
with `pg_restore`.

## Manual run

You can trigger a backup manually in two ways:

- from the admin app: `Admin -> Customize -> Operations -> Run backup now`
- through the admin API: `POST /api/admin/system/database-backup/run`

To inspect the current backup state, use:

- `GET /api/admin/system/database-backup`

## Local script usage

The repo still includes shell scripts for one-off CLI usage:

- [backup-postgres-to-firebase.sh](../scripts/backups/backup-postgres-to-firebase.sh)
- [prune-firebase-backups.sh](../scripts/backups/prune-firebase-backups.sh)

If you want to run them outside GitHub Actions, provide the same environment
variables and make sure both `pg_dump` and `gsutil` are installed and
authenticated.

For the manual backup script specifically:

- `BACKUP_DATABASE_*` values are optional when `SPRING_DATASOURCE_URL`,
  `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` already point
  at the database you want to dump
- `BACKUP_OUTPUT_DIRECTORY` is supported for parity with the backend scheduler
  config, and the legacy `BACKUP_OUTPUT_DIR` name still works

For restore instructions, see [database-restore.md](./database-restore.md).
