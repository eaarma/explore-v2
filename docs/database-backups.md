# Database Backups

This project includes a simple nightly PostgreSQL backup flow that stores
compressed `pg_dump` artifacts in Firebase Storage and keeps the last `14` days
of backups.

## What runs nightly

The scheduled workflow is [nightly-db-backup.yml](../.github/workflows/nightly-db-backup.yml).

Current schedule:

- `15 0 * * *` in GitHub Actions cron syntax
- GitHub Actions schedules are always `UTC`
- that currently runs at `03:15` in `Europe/Tallinn` during daylight saving time

Each run does this:

1. install `pg_dump`
2. create a compressed PostgreSQL custom-format dump
3. upload the dump to `gs://<bucket>/backups/postgres/`
4. delete any backup objects older than `14` days from that prefix

## Required GitHub secrets

Configure these repository or environment secrets before enabling the workflow:

- `BACKUP_DATABASE_HOST`
- `BACKUP_DATABASE_PORT`
- `BACKUP_DATABASE_NAME`
- `BACKUP_DATABASE_USER`
- `BACKUP_DATABASE_PASSWORD`
- `BACKUP_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`

`FIREBASE_SERVICE_ACCOUNT_BASE64` should be the base64-encoded contents of a
Google service account JSON file with permission to create, list, and delete
objects in the backup bucket.

## Backup file format

Backups are created with:

- `pg_dump --format=custom --compress=9 --no-owner --no-privileges`

That means each backup is already compressed and is suitable for later restore
with `pg_restore`.

## Manual run

You can trigger the workflow manually from the GitHub Actions tab with
`workflow_dispatch`.

## Local script usage

The workflow uses these scripts:

- [backup-postgres-to-firebase.sh](../scripts/backups/backup-postgres-to-firebase.sh)
- [prune-firebase-backups.sh](../scripts/backups/prune-firebase-backups.sh)

If you want to run them outside GitHub Actions, provide the same environment
variables and make sure both `pg_dump` and `gsutil` are installed and
authenticated.

For restore instructions, see [database-restore.md](./database-restore.md).
