#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
: "${DATABASE_URL:?Set DATABASE_URL}"
QUESTION="${*:?Usage: ./search.sh \"customer question\"}"

QUERY_VECTOR="$("${SCRIPT_DIR}/.venv/bin/python" - "${QUESTION}" <<'PY'
import json, os, sys, urllib.request
body = json.dumps({
    "model": os.getenv("EMBEDDING_MODEL", "nomic-embed-text"),
    "input": sys.argv[1],
}).encode()
req = urllib.request.Request(
    os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/") + "/api/embed",
    data=body, headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req, timeout=120) as response:
    values = json.load(response)["embeddings"][0]
print("[" + ",".join(f"{v:.9g}" for v in values) + "]")
PY
)"

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -v query_vector="${QUERY_VECTOR}" \
  -c "SELECT e.source_title, e.source_type, c.content,
             round((1 - (e.embedding_vector <=> :'query_vector'::vector))::numeric, 4) AS similarity
      FROM document_embeddings e
      JOIN knowledge_chunks c ON c.chunk_id = e.chunk_id
      JOIN knowledge_documents d ON d.document_id = e.document_id
      WHERE d.status = 'ACTIVE'
      ORDER BY e.embedding_vector <=> :'query_vector'::vector
      LIMIT 5;"
