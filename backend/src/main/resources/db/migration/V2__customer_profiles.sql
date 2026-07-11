CREATE TABLE IF NOT EXISTS customer_profiles (
    customer_id BIGINT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    locale VARCHAR(16),
    timezone VARCHAR(64),
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
