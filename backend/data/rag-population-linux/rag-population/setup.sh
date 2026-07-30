#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="postgresql://aichatbot:aichatbot@localhost:5432/aichatbot"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
: "${DATABASE_URL:?Set DATABASE_URL, for example postgresql://aichatbot:aichatbot@localhost:5432/ragdb}"

command -v psql >/dev/null || { echo "psql is required."; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required."; exit 1; }
command -v ollama >/dev/null || { echo "ollama is required."; exit 1; }

python3 -m venv "${SCRIPT_DIR}/.venv"
"${SCRIPT_DIR}/.venv/bin/pip" install --upgrade pip
"${SCRIPT_DIR}/.venv/bin/pip" install -r "${SCRIPT_DIR}/requirements.txt"

ollama pull "${EMBEDDING_MODEL:-nomic-embed-text}"
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/sql/001_rag_schema.sql"

echo "Setup complete. Run: ${SCRIPT_DIR}/populate.sh"
