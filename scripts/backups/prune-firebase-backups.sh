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
require_env BACKUP_FIREBASE_STORAGE_BUCKET

backup_prefix="${BACKUP_FIREBASE_PREFIX:-backups/postgres}"
backup_prefix="${backup_prefix%/}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
cutoff_epoch="$(date -u -d "${retention_days} days ago" +%s)"
backup_uri="gs://${BACKUP_FIREBASE_STORAGE_BUCKET}/${backup_prefix}/**"

mapfile -t objects < <(gsutil ls -l "${backup_uri}" 2>/dev/null || true)

if [[ "${#objects[@]}" -eq 0 ]]; then
  echo "No existing backups found under ${backup_uri}"
  exit 0
fi

for object_line in "${objects[@]}"; do
  object_line="${object_line#"${object_line%%[![:space:]]*}"}"

  if [[ -z "${object_line}" || "${object_line}" == TOTAL:* ]]; then
    continue
  fi

  object_size="$(awk '{print $1}' <<< "${object_line}")"
  object_timestamp="$(awk '{print $2}' <<< "${object_line}")"
  object_uri="$(awk '{print $3}' <<< "${object_line}")"

  if [[ -z "${object_size}" || -z "${object_timestamp}" || -z "${object_uri}" ]]; then
    continue
  fi

  object_epoch="$(date -u -d "${object_timestamp}" +%s)"

  if (( object_epoch < cutoff_epoch )); then
    echo "Deleting expired backup ${object_uri}"
    gsutil rm "${object_uri}"
  fi
done
