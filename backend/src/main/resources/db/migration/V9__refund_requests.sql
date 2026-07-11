CREATE TABLE IF NOT EXISTS refund_requests (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL,
    customer_id VARCHAR(128) NOT NULL,
    reason TEXT,
    amount NUMERIC(19, 2),
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    eligibility_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_service_ref VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
