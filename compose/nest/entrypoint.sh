#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

echo "Aguardando PostgreSQL em ${DB_HOST}:${DB_PORT}..."

while true; do
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1 && break
  else
    if bash -c "cat < /dev/tcp/${DB_HOST}/${DB_PORT}" >/dev/null 2>&1; then
      break
    fi
  fi
  printf '.'
  sleep 1
done

echo
echo "Postgres disponível — preparando ambiente..."

if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null || true)" ]; then
  echo "Instalando dependências (yarn)..."
  corepack enable || true
  corepack prepare yarn@stable --activate || true
  yarn install --frozen-lockfile --silent || yarn install --silent
fi

echo "Garantindo existência do banco e aplicando migrações..."
yarn db:create || true
yarn migrate || true

echo "Iniciando aplicação..."
exec yarn start:prod