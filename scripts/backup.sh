#!/bin/bash

set -e

BACKUP_DIR="/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILE_NAME="${POSTGRES_DB}_backup_${DATE}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "[BACKUP] Starting backup"
echo "[BACKUP] Database: $POSTGRES_DB"
echo "[BACKUP] Host: $POSTGRES_HOST"
echo "[BACKUP] File: $BACKUP_DIR/$FILE_NAME"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_DIR/$FILE_NAME"

echo "[BACKUP] Backup created successfully"

echo "[BACKUP] Removing backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[BACKUP] Finished"