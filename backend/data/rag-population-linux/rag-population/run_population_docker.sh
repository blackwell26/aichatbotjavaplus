#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PG_CONTAINER="${PG_CONTAINER:-aichatbot_postgres}"
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"
PG_SUPERPASSWORD="${PG_SUPERPASSWORD:-}"
PG_DB="${PG_DB:-ragdb}"
PG_USER="${PG_USER:-rag_user}"
PG_PASSWORD="${PG_PASSWORD:-change_me}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
EMBEDDING_MODEL="${EMBEDDING_MODEL:-nomic-embed-text}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required." >&2
  exit 1
fi

if ! docker inspect "${PG_CONTAINER}" >/dev/null 2>&1; then
  echo "PostgreSQL container '${PG_CONTAINER}' is not running or not found." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required on the host to run this helper." >&2
  exit 1
fi

if ! curl -fsS "${OLLAMA_URL%/}/api/tags" >/dev/null 2>&1; then
  echo "Ollama is not reachable at ${OLLAMA_URL}." >&2
  exit 1
fi

echo "Checking PostgreSQL database and user..."
if [[ -n "${PG_SUPERPASSWORD}" ]]; then
  export PGPASSWORD="${PG_SUPERPASSWORD}"
fi

if ! docker exec "${PG_CONTAINER}" psql -U "${PG_SUPERUSER}" -tAc "SELECT 1 FROM pg_roles WHERE rolname = '${PG_USER}'" | grep -q 1; then
  docker exec "${PG_CONTAINER}" psql -U "${PG_SUPERUSER}" -c "CREATE USER ${PG_USER} WITH PASSWORD '${PG_PASSWORD}';"
fi

if ! docker exec "${PG_CONTAINER}" psql -U "${PG_SUPERUSER}" -tAc "SELECT 1 FROM pg_database WHERE datname = '${PG_DB}'" | grep -q 1; then
  docker exec "${PG_CONTAINER}" psql -U "${PG_SUPERUSER}" -c "CREATE DATABASE ${PG_DB} OWNER ${PG_USER};"
fi

echo "Ensuring pgvector extension exists..."
docker exec "${PG_CONTAINER}" psql -U "${PG_SUPERUSER}" -d "${PG_DB}" -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo "Running schema setup..."
export DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DB}"
export OLLAMA_URL
export EMBEDDING_MODEL

"${SCRIPT_DIR}/setup.sh"
"${SCRIPT_DIR}/populate.sh"

echo "RAG population completed successfully."
