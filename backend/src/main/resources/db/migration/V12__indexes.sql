CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets (customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets (created_at);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments (created_at);

CREATE INDEX IF NOT EXISTS idx_escalations_session_id ON escalations (session_id);
CREATE INDEX IF NOT EXISTS idx_escalations_customer_id ON escalations (customer_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations (status);
CREATE INDEX IF NOT EXISTS idx_escalations_created_at ON escalations (created_at);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON knowledge_chunks (document_id);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings (document_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_chunk_id ON document_embeddings (chunk_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector
    ON document_embeddings USING hnsw (embedding_vector vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_refund_requests_order_number ON refund_requests (order_number);
CREATE INDEX IF NOT EXISTS idx_refund_requests_customer_id ON refund_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests (status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_period_start ON analytics_snapshots (period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_recorded_at ON analytics_snapshots (recorded_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_logged_at ON audit_logs (logged_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs (resource_type);
