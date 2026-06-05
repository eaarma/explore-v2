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

require_command pg_dump
require_command gsutil

require_env BACKUP_DATABASE_HOST
require_env BACKUP_DATABASE_NAME
require_env BACKUP_DATABASE_USER
require_env BACKUP_DATABASE_PASSWORD
require_env BACKUP_FIREBASE_STORAGE_BUCKET

backup_port="${BACKUP_DATABASE_PORT:-5432}"
backup_prefix="${BACKUP_FIREBASE_PREFIX:-backups/postgres}"
backup_prefix="${backup_prefix%/}"
backup_file_prefix="${BACKUP_FILE_PREFIX:-explore-app-postgres}"
backup_output_dir="${BACKUP_OUTPUT_DIR:-${RUNNER_TEMP:-/tmp}/explore-db-backups}"
timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
backup_file_name="${backup_file_prefix}-${timestamp}.dump"
local_backup_path="${backup_output_dir}/${backup_file_name}"
remote_backup_uri="gs://${BACKUP_FIREBASE_STORAGE_BUCKET}/${backup_prefix}/${backup_file_name}"

mkdir -p "${backup_output_dir}"

export PGPASSWORD="${BACKUP_DATABASE_PASSWORD}"

pg_dump \
  --host="${BACKUP_DATABASE_HOST}" \
  --port="${backup_port}" \
  --username="${BACKUP_DATABASE_USER}" \
  --dbname="${BACKUP_DATABASE_NAME}" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="${local_backup_path}"

gsutil cp "${local_backup_path}" "${remote_backup_uri}"

echo "Created database backup at ${remote_backup_uri}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "local_backup_path=${local_backup_path}"
    echo "remote_backup_uri=${remote_backup_uri}"
  } >> "${GITHUB_OUTPUT}"
fi
