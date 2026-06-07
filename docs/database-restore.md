# Database Restore

This project includes a manual restore script for PostgreSQL backups stored in
Firebase Storage:

- [restore-postgres-from-firebase.sh](../scripts/backups/restore-postgres-from-firebase.sh)

Use it when you need to restore a previously uploaded `.dump` backup created by
the backend-managed backup flow.

## Restore overview

The restore flow is:

1. stop the backend or put the app into maintenance mode
2. choose a backup object from Firebase Storage
3. download the backup locally
4. optionally recreate the target database
5. ensure the `postgis` extension exists
6. run `pg_restore`
7. verify the restored database
8. start the backend again

## Required environment variables

Always required:

- `RESTORE_DATABASE_HOST`
- `RESTORE_DATABASE_PORT`
- `RESTORE_DATABASE_NAME`
- `RESTORE_DATABASE_USER`
- `RESTORE_DATABASE_PASSWORD`

Backup source:

- either `RESTORE_BACKUP_URI`
- or both `RESTORE_FIREBASE_STORAGE_BUCKET` and `RESTORE_BACKUP_OBJECT`

Optional:

- `RESTORE_WORK_DIR`
- `RESTORE_LOCAL_FILE_NAME`
- `RESTORE_MAINTENANCE_DATABASE`
- `RESTORE_RECREATE_DATABASE`
- `RESTORE_ENABLE_POSTGIS`

Defaults:

- `RESTORE_DATABASE_PORT=5432`
- `RESTORE_MAINTENANCE_DATABASE=postgres`
- `RESTORE_RECREATE_DATABASE=false`
- `RESTORE_ENABLE_POSTGIS=true`

## Source examples

Using a full backup URI:

```bash
export RESTORE_BACKUP_URI="gs://my-bucket/backups/postgres/explore-app-postgres-2026-06-04T00-15-00Z.dump"
```

Using bucket and object separately:

```bash
export RESTORE_FIREBASE_STORAGE_BUCKET="my-bucket"
export RESTORE_BACKUP_OBJECT="backups/postgres/explore-app-postgres-2026-06-04T00-15-00Z.dump"
```

## Restore examples

Restore into an existing database in place:

```bash
export RESTORE_DATABASE_HOST="db.example.com"
export RESTORE_DATABASE_PORT="5432"
export RESTORE_DATABASE_NAME="explore_app"
export RESTORE_DATABASE_USER="postgres"
export RESTORE_DATABASE_PASSWORD="super-secret-password"
export RESTORE_BACKUP_URI="gs://my-bucket/backups/postgres/explore-app-postgres-2026-06-04T00-15-00Z.dump"

./scripts/backups/restore-postgres-from-firebase.sh
```

Restore by recreating the target database first:

```bash
export RESTORE_DATABASE_HOST="db.example.com"
export RESTORE_DATABASE_PORT="5432"
export RESTORE_DATABASE_NAME="explore_app"
export RESTORE_DATABASE_USER="postgres"
export RESTORE_DATABASE_PASSWORD="super-secret-password"
export RESTORE_BACKUP_URI="gs://my-bucket/backups/postgres/explore-app-postgres-2026-06-04T00-15-00Z.dump"
export RESTORE_RECREATE_DATABASE="true"

./scripts/backups/restore-postgres-from-firebase.sh
```

## What the script does

The script:

1. downloads the selected backup from Firebase Storage using `gsutil cp`
2. creates the target database if it does not exist
3. if `RESTORE_RECREATE_DATABASE=true`, terminates active sessions and recreates the target database
4. creates `postgis` if needed
5. runs:

```bash
pg_restore \
  --clean \
  --if-exists \
  --exit-on-error \
  --no-owner \
  --no-privileges
```

## Verification after restore

Run a few quick checks before bringing traffic back:

```bash
psql -h "$RESTORE_DATABASE_HOST" -p "$RESTORE_DATABASE_PORT" -U "$RESTORE_DATABASE_USER" -d "$RESTORE_DATABASE_NAME" -c "SELECT COUNT(*) FROM users;"
psql -h "$RESTORE_DATABASE_HOST" -p "$RESTORE_DATABASE_PORT" -U "$RESTORE_DATABASE_USER" -d "$RESTORE_DATABASE_NAME" -c "SELECT COUNT(*) FROM locations;"
psql -h "$RESTORE_DATABASE_HOST" -p "$RESTORE_DATABASE_PORT" -U "$RESTORE_DATABASE_USER" -d "$RESTORE_DATABASE_NAME" -c "SELECT COUNT(*) FROM journeys;"
```

Then start the backend and confirm:

- `/actuator/health` is `UP`
- login works
- public locations/journeys load

## Notes

- Restore is intentionally documented as a manual operation for now.
- The database backup restores PostgreSQL data only. Firebase Storage-backed
  images are not included in the `.dump` and still depend on the bucket data
  remaining available.
- It is safest to stop the backend before restore so there are no writes during
  the operation.
