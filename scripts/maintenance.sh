#!/bin/bash

set -e

LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-7}"

echo "[MAINTENANCE] Starting maintenance"
echo "[MAINTENANCE] Database: $POSTGRES_DB"
echo "[MAINTENANCE] Host: $POSTGRES_HOST"

echo "[MAINTENANCE] Running VACUUM ANALYZE"

PGPASSWORD="$POSTGRES_PASSWORD" vacuumdb \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --analyze \
  --verbose

echo "[MAINTENANCE] Running REINDEX DATABASE"

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -c "REINDEX DATABASE $POSTGRES_DB;"

echo "[MAINTENANCE] Cleaning PostgreSQL logs older than $LOG_RETENTION_DAYS days"

find /postgres-logs -type f -name "*.log" -mtime +"$LOG_RETENTION_DAYS" -delete

echo "[MAINTENANCE] Finished successfully"