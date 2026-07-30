# RAG table population on Linux

This package implements the design's `knowledge_documents`,
`knowledge_chunks`, and `document_embeddings` tables using PostgreSQL with
pgvector. Ollama generates embeddings locally.

## Prerequisites

- Linux with Python 3.10+, `python3-venv`, PostgreSQL client (`psql`), and Ollama
- A PostgreSQL server with pgvector installed
- A database user allowed to create extensions and tables

On Ubuntu/Debian, install the client and Python support:

```bash
sudo apt update
sudo apt install -y postgresql-client python3-venv
```

Install pgvector on the PostgreSQL **server** using the package appropriate to
its PostgreSQL version, or use the `pgvector/pgvector` container image.

## Configure and populate

```bash
cd rag-population
chmod +x setup.sh populate.sh search.sh

export DATABASE_URL='postgresql://rag_user:change_me@localhost:5432/ragdb'
export OLLAMA_URL='http://localhost:11434'
export EMBEDDING_MODEL='nomic-embed-text'
# If Ollama runs in Docker, set the container name instead of using OLLAMA_URL.
# export OLLAMA_CONTAINER='aichatbot_ollama'

./setup.sh
./populate.sh
```

Place additional UTF-8 `.md` or `.txt` files under `knowledge/`, or pass a
different directory:

```bash
./populate.sh /opt/customer-service/knowledge
```

Files with `faq`, `policy`, `manual`, or `support` in their names receive the
corresponding source type. Other files become `SUPPORT_ARTICLE`.

The default seed corpus includes:

- `faq_returns.md`
- `payment_support.md`
- `shipping_policy.md`
- `order_tracking.md`
- `refund_status.md`
- `login_account_help.md`

## Test retrieval

```bash
./search.sh "How long does a refund take?"
```

## Behavior and operations

- Re-running ingestion skips unchanged files.
- Changing a file creates a new document version and marks the prior version
  inactive.
- Each document is split into heading-aware chunks with 1,000-character target
  size and 150-character overlap.
- The HNSW cosine index supports semantic nearest-neighbour search.
- One file is committed at a time; a failed file is rolled back.

`nomic-embed-text` produces 1536-dimensional vectors in this setup. If another
model is used, change both `vector(1536)` in `sql/001_rag_schema.sql` and the
ingestion `--dimensions` value before creating the schema.

Do not place database passwords in these scripts. Supply secrets through the
environment or a Linux secrets manager.
