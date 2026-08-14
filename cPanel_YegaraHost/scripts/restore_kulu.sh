#!/usr/bin/env bash
# Restore Kulu from a backup archive created by backup_kulu.sh
#
# Usage:
#   export KULU_CORE=$HOME/kulu_core
#   bash restore_kulu.sh /path/to/kulu_YYYYMMDD_HHMMSS.tar.gz
#
# WARNING: Overwrites database and storage/app/public. Confirm before running.

set -euo pipefail

ARCHIVE="${1:-}"
KULU_CORE="${KULU_CORE:-$HOME/kulu_core}"
TMP="${TMPDIR:-/tmp}/kulu_restore_$$"

if [[ -z "$ARCHIVE" || ! -f "$ARCHIVE" ]]; then
  echo "Usage: $0 /path/to/kulu_YYYYMMDD_HHMMSS.tar.gz"
  exit 1
fi

if [[ ! -f "$KULU_CORE/.env" ]]; then
  echo "ERROR: $KULU_CORE/.env not found"
  exit 1
fi

get_env() {
  local key="$1"
  grep -E "^${key}=" "$KULU_CORE/.env" | tail -n1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

DB_HOST="$(get_env DB_HOST)"; DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="$(get_env DB_PORT)"; DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="$(get_env DB_DATABASE)"
DB_USERNAME="$(get_env DB_USERNAME)"
DB_PASSWORD="$(get_env DB_PASSWORD)"

echo "Restore from: $ARCHIVE"
echo "Target core:  $KULU_CORE"
echo "Database:     $DB_DATABASE"
read -r -p "Type YES to continue: " CONFIRM
[[ "$CONFIRM" == "YES" ]] || { echo "Aborted"; exit 1; }

mkdir -p "$TMP"
tar -xzf "$ARCHIVE" -C "$TMP"
INNER="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -n1)"
if [[ -z "$INNER" ]]; then
  echo "ERROR: archive layout unexpected"
  exit 1
fi

if [[ -f "$INNER/database.sql.gz" ]]; then
  echo "Restoring database..."
  export MYSQL_PWD="$DB_PASSWORD"
  gunzip -c "$INNER/database.sql.gz" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_DATABASE"
  unset MYSQL_PWD
  echo "  DB restored"
fi

if [[ -f "$INNER/storage_public.tar.gz" ]]; then
  echo "Restoring storage/app/public..."
  mkdir -p "$KULU_CORE/storage/app"
  tar -xzf "$INNER/storage_public.tar.gz" -C "$KULU_CORE/storage/app"
  echo "  storage restored"
fi

echo "Note: env.copy is NOT auto-applied (avoid overwriting live secrets)."
echo "Done. Run: php artisan config:cache"
rm -rf "$TMP"
