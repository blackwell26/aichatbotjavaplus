CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aichatbot') THEN
        CREATE ROLE aichatbot LOGIN PASSWORD 'aichatbot';
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE aichatbot TO aichatbot;
