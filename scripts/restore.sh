#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: /scripts/restore.sh /backups/file.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[RESTORE] Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[RESTORE] Restoring backup: $BACKUP_FILE"
echo "[RESTORE] Database: $POSTGRES_DB"
echo "[RESTORE] Host: $POSTGRES_HOST"

echo "[RESTORE] Dropping and recreating public schema"

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "[RESTORE] Applying backup"

gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB"

echo "[RESTORE] Finished"