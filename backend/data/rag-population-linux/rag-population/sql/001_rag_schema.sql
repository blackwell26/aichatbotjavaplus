CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    source_uri TEXT NOT NULL,
    source_title TEXT NOT NULL,
    source_type VARCHAR(64) NOT NULL DEFAULT 'SUPPORT_ARTICLE',
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    content_hash CHAR(64) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
    uploaded_by VARCHAR(128),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_uri, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_knowledge_document
    ON knowledge_documents (source_uri)
    WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES knowledge_documents(id)
        ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 0),
    content TEXT NOT NULL CHECK (length(btrim(content)) > 0),
    token_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS document_embeddings (
    id BIGSERIAL PRIMARY KEY,
    embedding_id VARCHAR(64) NOT NULL UNIQUE,
    document_id BIGINT NOT NULL REFERENCES knowledge_documents(id)
        ON DELETE CASCADE,
    chunk_id BIGINT NOT NULL UNIQUE REFERENCES knowledge_chunks(id)
        ON DELETE CASCADE,
    embedding_model VARCHAR(150) NOT NULL,
    embedding_vector vector(1536) NOT NULL,
    source_title VARCHAR(300) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    version INTEGER NOT NULL,
    dimension INTEGER NOT NULL DEFAULT 1536,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document
    ON knowledge_chunks (document_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_documents_type_status
    ON knowledge_documents (source_type, status);
CREATE INDEX IF NOT EXISTS idx_embeddings_document
    ON document_embeddings (document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw_cosine
    ON document_embeddings
    USING hnsw (embedding_vector vector_cosine_ops);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_knowledge_documents_updated_at
    ON knowledge_documents;
CREATE TRIGGER trg_knowledge_documents_updated_at
BEFORE UPDATE ON knowledge_documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
