CREATE TABLE IF NOT EXISTS escalations (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(128) NOT NULL,
    trigger_type VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    ai_confidence_level VARCHAR(16),
    ai_confidence_score DOUBLE PRECISION,
    transcript_ref VARCHAR(512),
    summary TEXT,
    ticket_id BIGINT REFERENCES support_tickets(id) ON DELETE SET NULL,
    assigned_agent_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
