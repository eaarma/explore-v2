#!/usr/bin/env bash
set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Required command is not available: ${command_name}" >&2
    exit 1
  fi
}

require_command gsutil
require_command psql
require_command pg_restore

require_env RESTORE_DATABASE_HOST
require_env RESTORE_DATABASE_NAME
require_env RESTORE_DATABASE_USER
require_env RESTORE_DATABASE_PASSWORD

restore_port="${RESTORE_DATABASE_PORT:-5432}"
restore_work_dir="${RESTORE_WORK_DIR:-${RUNNER_TEMP:-/tmp}/explore-db-restore}"
restore_file_name="${RESTORE_LOCAL_FILE_NAME:-restore-target.dump}"
restore_local_path="${restore_work_dir}/${restore_file_name}"
restore_backup_uri="${RESTORE_BACKUP_URI:-}"
restore_recreate_database="${RESTORE_RECREATE_DATABASE:-false}"
restore_enable_postgis="${RESTORE_ENABLE_POSTGIS:-true}"
restore_maintenance_database="${RESTORE_MAINTENANCE_DATABASE:-postgres}"

resolve_backup_uri() {
  if [[ -n "${restore_backup_uri}" ]]; then
    echo "${restore_backup_uri}"
    return
  fi

  require_env RESTORE_FIREBASE_STORAGE_BUCKET
  require_env RESTORE_BACKUP_OBJECT

  local restore_backup_object="${RESTORE_BACKUP_OBJECT#/}"
  echo "gs://${RESTORE_FIREBASE_STORAGE_BUCKET}/${restore_backup_object}"
}

terminate_database_connections() {
  local database_name="$1"

  psql \
    --host="${RESTORE_DATABASE_HOST}" \
    --port="${restore_port}" \
    --username="${RESTORE_DATABASE_USER}" \
    --dbname="${restore_maintenance_database}" \
    --set=restore_db="${database_name}" \
    --no-psqlrc \
    --quiet \
    --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = :'restore_db' AND pid <> pg_backend_pid();"
}

database_exists() {
  local database_name="$1"

  local result
  result="$(
    psql \
      --host="${RESTORE_DATABASE_HOST}" \
      --port="${restore_port}" \
      --username="${RESTORE_DATABASE_USER}" \
      --dbname="${restore_maintenance_database}" \
      --set=restore_db="${database_name}" \
      --tuples-only \
      --no-align \
      --no-psqlrc \
      --quiet \
      --command="SELECT 1 FROM pg_database WHERE datname = :'restore_db';"
  )"

  [[ "${result}" == "1" ]]
}

ensure_database_exists() {
  local database_name="$1"

  if database_exists "${database_name}"; then
    return
  fi

  require_command createdb

  createdb \
    --host="${RESTORE_DATABASE_HOST}" \
    --port="${restore_port}" \
    --username="${RESTORE_DATABASE_USER}" \
    "${database_name}"
}

recreate_database() {
  local database_name="$1"

  require_command dropdb
  require_command createdb

  terminate_database_connections "${database_name}"

  dropdb \
    --if-exists \
    --host="${RESTORE_DATABASE_HOST}" \
    --port="${restore_port}" \
    --username="${RESTORE_DATABASE_USER}" \
    "${database_name}"

  createdb \
    --host="${RESTORE_DATABASE_HOST}" \
    --port="${restore_port}" \
    --username="${RESTORE_DATABASE_USER}" \
    "${database_name}"
}

ensure_postgis_extension() {
  local database_name="$1"

  if [[ "${restore_enable_postgis}" != "true" ]]; then
    return
  fi

  psql \
    --host="${RESTORE_DATABASE_HOST}" \
    --port="${restore_port}" \
    --username="${RESTORE_DATABASE_USER}" \
    --dbname="${database_name}" \
    --no-psqlrc \
    --quiet \
    --command="CREATE EXTENSION IF NOT EXISTS postgis;"
}

mkdir -p "${restore_work_dir}"

resolved_backup_uri="$(resolve_backup_uri)"

export PGPASSWORD="${RESTORE_DATABASE_PASSWORD}"

gsutil cp "${resolved_backup_uri}" "${restore_local_path}"

if [[ "${restore_recreate_database}" == "true" ]]; then
  recreate_database "${RESTORE_DATABASE_NAME}"
else
  ensure_database_exists "${RESTORE_DATABASE_NAME}"
fi

ensure_postgis_extension "${RESTORE_DATABASE_NAME}"

pg_restore \
  --host="${RESTORE_DATABASE_HOST}" \
  --port="${restore_port}" \
  --username="${RESTORE_DATABASE_USER}" \
  --dbname="${RESTORE_DATABASE_NAME}" \
  --clean \
  --if-exists \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  "${restore_local_path}"

echo "Restored ${resolved_backup_uri} into database ${RESTORE_DATABASE_NAME}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "restore_local_path=${restore_local_path}"
    echo "restored_backup_uri=${resolved_backup_uri}"
  } >> "${GITHUB_OUTPUT}"
fi
