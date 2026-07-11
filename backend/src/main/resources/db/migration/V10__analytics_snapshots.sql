CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id BIGSERIAL PRIMARY KEY,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    chat_volume BIGINT NOT NULL DEFAULT 0,
    avg_response_time_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    escalation_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    satisfaction_score DOUBLE PRECISION,
    model_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    fallback_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
