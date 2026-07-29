CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS knowledge_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_uri TEXT NOT NULL,
    source_title VARCHAR(300) NOT NULL,
    source_type VARCHAR(50) NOT NULL
        CHECK (source_type IN ('FAQ', 'POLICY', 'MANUAL', 'SUPPORT_ARTICLE')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    content_hash CHAR(64) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'PROCESSING', 'FAILED')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_uri, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_knowledge_document
    ON knowledge_documents (source_uri)
    WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(document_id)
        ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
    content TEXT NOT NULL CHECK (length(btrim(content)) > 0),
    token_count INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS document_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(document_id)
        ON DELETE CASCADE,
    chunk_id UUID NOT NULL UNIQUE REFERENCES knowledge_chunks(chunk_id)
        ON DELETE CASCADE,
    embedding_model VARCHAR(150) NOT NULL,
    embedding_vector vector(768) NOT NULL,
    source_title VARCHAR(300) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document
    ON knowledge_chunks (document_id, chunk_index);
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
