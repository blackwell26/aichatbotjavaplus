#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
: "${DATABASE_URL:?Set DATABASE_URL, for example postgresql://rag_user:password@localhost:5432/ragdb}"

"${SCRIPT_DIR}/.venv/bin/python" "${SCRIPT_DIR}/ingest.py" \
  "${1:-${SCRIPT_DIR}/knowledge}"

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/sql/002_verify.sql"
