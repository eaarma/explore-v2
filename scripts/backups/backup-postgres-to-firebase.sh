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

parse_spring_datasource_url() {
  local datasource_url="${SPRING_DATASOURCE_URL:-}"

  if [[ -z "${datasource_url}" || "${datasource_url}" != jdbc:postgresql://* ]]; then
    return 0
  fi

  local normalized_url="${datasource_url#jdbc:postgresql://}"
  normalized_url="${normalized_url%%\?*}"

  local authority="${normalized_url%%/*}"
  local database_name="${normalized_url#*/}"

  if [[ -z "${authority}" || -z "${database_name}" || "${authority}" == "${normalized_url}" ]]; then
    return 0
  fi

  if [[ "${authority}" == *:* ]]; then
    SPRING_PARSED_DATABASE_HOST="${authority%%:*}"
    SPRING_PARSED_DATABASE_PORT="${authority##*:}"
  else
    SPRING_PARSED_DATABASE_HOST="${authority}"
    SPRING_PARSED_DATABASE_PORT=""
  fi

  SPRING_PARSED_DATABASE_NAME="${database_name}"
}

require_command pg_dump
require_command gsutil

require_env BACKUP_FIREBASE_STORAGE_BUCKET

SPRING_PARSED_DATABASE_HOST=""
SPRING_PARSED_DATABASE_PORT=""
SPRING_PARSED_DATABASE_NAME=""
parse_spring_datasource_url

backup_host="${BACKUP_DATABASE_HOST:-${SPRING_PARSED_DATABASE_HOST:-}}"
backup_port="${BACKUP_DATABASE_PORT:-${SPRING_PARSED_DATABASE_PORT:-5432}}"
backup_name="${BACKUP_DATABASE_NAME:-${SPRING_PARSED_DATABASE_NAME:-}}"
backup_user="${BACKUP_DATABASE_USER:-${SPRING_DATASOURCE_USERNAME:-}}"
backup_password="${BACKUP_DATABASE_PASSWORD:-${SPRING_DATASOURCE_PASSWORD:-}}"

require_env backup_host
require_env backup_name
require_env backup_user
require_env backup_password

backup_prefix="${BACKUP_FIREBASE_PREFIX:-backups/postgres}"
backup_prefix="${backup_prefix%/}"
backup_file_prefix="${BACKUP_FILE_PREFIX:-explore-app-postgres}"
backup_output_dir="${BACKUP_OUTPUT_DIRECTORY:-${BACKUP_OUTPUT_DIR:-${RUNNER_TEMP:-/tmp}/explore-db-backups}}"
timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
backup_file_name="${backup_file_prefix}-${timestamp}.dump"
local_backup_path="${backup_output_dir}/${backup_file_name}"
remote_backup_uri="gs://${BACKUP_FIREBASE_STORAGE_BUCKET}/${backup_prefix}/${backup_file_name}"

mkdir -p "${backup_output_dir}"

export PGPASSWORD="${backup_password}"

pg_dump \
  --host="${backup_host}" \
  --port="${backup_port}" \
  --username="${backup_user}" \
  --dbname="${backup_name}" \
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
