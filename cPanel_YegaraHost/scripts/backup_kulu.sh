#!/usr/bin/env bash
# Kulu production backup — database + storage + critical config (no secrets in git)
# Usage (on server):
#   export KULU_CORE=$HOME/kulu_core
#   export BACKUP_DIR=$HOME/backups/kulu
#   bash backup_kulu.sh
#
# Cron example (daily 02:30):
#   30 2 * * * /bin/bash $HOME/kulu_core/scripts/backup_kulu.sh >>$HOME/backups/kulu/backup.log 2>&1

set -euo pipefail

KULU_CORE="${KULU_CORE:-$HOME/kulu_core}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/kulu}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d_%H%M%S)"
DEST="${BACKUP_DIR}/${STAMP}"

mkdir -p "$DEST"

if [[ ! -f "$KULU_CORE/.env" ]]; then
  echo "ERROR: $KULU_CORE/.env not found"
  exit 1
fi

# Parse DB credentials from .env (simple KEY=VALUE)
get_env() {
  local key="$1"
  grep -E "^${key}=" "$KULU_CORE/.env" | tail -n1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

DB_HOST="$(get_env DB_HOST)"
DB_PORT="$(get_env DB_PORT)"
DB_DATABASE="$(get_env DB_DATABASE)"
DB_USERNAME="$(get_env DB_USERNAME)"
DB_PASSWORD="$(get_env DB_PASSWORD)"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

echo "[$(date -Iseconds)] Backup start → $DEST"

# 1) Database dump
if command -v mysqldump >/dev/null 2>&1; then
  export MYSQL_PWD="$DB_PASSWORD"
  mysqldump \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USERNAME" \
    --single-transaction \
    --routines \
    --triggers \
    "$DB_DATABASE" \
    | gzip -c > "$DEST/database.sql.gz"
  unset MYSQL_PWD
  echo "  DB: database.sql.gz ($(du -h "$DEST/database.sql.gz" | cut -f1))"
else
  echo "  WARN: mysqldump not found — skipped DB"
fi

# 2) Storage (product images, etc.)
if [[ -d "$KULU_CORE/storage/app/public" ]]; then
  tar -C "$KULU_CORE/storage/app" -czf "$DEST/storage_public.tar.gz" public
  echo "  Files: storage_public.tar.gz"
fi

# 3) .env snapshot (restricted permissions)
if [[ -f "$KULU_CORE/.env" ]]; then
  cp "$KULU_CORE/.env" "$DEST/env.copy"
  chmod 600 "$DEST/env.copy"
  echo "  Config: env.copy (mode 600)"
fi

# 4) Manifest
{
  echo "stamp=$STAMP"
  echo "host=$(hostname 2>/dev/null || echo unknown)"
  echo "core=$KULU_CORE"
  echo "db=$DB_DATABASE"
} > "$DEST/MANIFEST.txt"

# 5) Pack one archive
tar -C "$BACKUP_DIR" -czf "${BACKUP_DIR}/kulu_${STAMP}.tar.gz" "$STAMP"
rm -rf "$DEST"
echo "  Archive: ${BACKUP_DIR}/kulu_${STAMP}.tar.gz"

# 6) Retention
if [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]] && [[ "$KEEP_DAYS" -gt 0 ]]; then
  find "$BACKUP_DIR" -maxdepth 1 -name 'kulu_*.tar.gz' -mtime +"$KEEP_DAYS" -delete || true
  echo "  Retention: deleted archives older than ${KEEP_DAYS} days"
fi

echo "[$(date -Iseconds)] Backup done"
