#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="postgresql://aichatbot:aichatbot@localhost:5432/aichatbot"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
: "${DATABASE_URL:?Set DATABASE_URL, for example postgresql://aichatbot:aichatbot@localhost:5432/ragdb}"

command -v psql >/dev/null || { echo "psql is required."; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required."; exit 1; }

python3 -m venv "${SCRIPT_DIR}/.venv"
"${SCRIPT_DIR}/.venv/bin/pip" install --upgrade pip
"${SCRIPT_DIR}/.venv/bin/pip" install -r "${SCRIPT_DIR}/requirements.txt"

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
EMBEDDING_MODEL="${EMBEDDING_MODEL:-nomic-embed-text}"

python3 - "${OLLAMA_URL}" "${EMBEDDING_MODEL}" <<'PY'
import json
import sys
import urllib.error
import urllib.request

base_url = sys.argv[1].rstrip("/")
model = sys.argv[2]
request = urllib.request.Request(
    f"{base_url}/api/pull",
    data=json.dumps({"model": model}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(request, timeout=600) as response:
        for line in response:
            # Read the streamed progress response to completion.
            pass
except urllib.error.URLError as exc:
    raise SystemExit(f"Failed to pull Ollama model '{model}' from {base_url}: {exc}")
PY

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/sql/001_rag_schema.sql"

echo "Setup complete. Run: ${SCRIPT_DIR}/populate.sh"
