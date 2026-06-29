# Backend Configuration Guide

This document describes all configuration groups for the AI Chatbot backend.

## Configuration Groups

Configuration is organized into logical groups per Spring Boot best practices. Each group can be overridden per profile (local, dev, test, prod).

### 1. Security: JWT Configuration

**Group:** `security.jwt`

JWT (JSON Web Token) configuration for user authentication and authorization.

#### Properties

```yaml
security:
  jwt:
    secret: ${JWT_SECRET}                    # Secret key for signing tokens (MUST be set in production)
    expiration: 3600                         # Access token expiration time in seconds (default: 1 hour)
    refresh-expiration: 604800               # Refresh token expiration time in seconds (default: 7 days)
    issuer: aichatbot                        # JWT issuer claim (identifies token source)
    audience: aichatbot-users                # JWT audience claim (identifies intended recipient)
```

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(required in prod)* | Secret key for signing/verifying tokens |
| `JWT_EXPIRATION` | `3600` | Access token lifetime (seconds) |
| `JWT_REFRESH_EXPIRATION` | `604800` | Refresh token lifetime (seconds) |
| `JWT_ISSUER` | `aichatbot` | Token issuer identifier |
| `JWT_AUDIENCE` | `aichatbot-users` | Token audience identifier |

#### Profile Defaults

- **local**: `secret=local-dev-secret-change-in-prod`, `expiration=3600`
- **dev**: `secret=${JWT_SECRET_DEV}`, `expiration=7200`
- **test**: `secret=test-secret-fixed-for-tests`, `expiration=3600`
- **prod**: `secret=${JWT_SECRET}` (must be provided), `expiration=${JWT_EXPIRATION}`

#### Usage

Used by `auth` package for:
- Encoding JWT tokens on login
- Validating tokens on protected endpoints
- Token refresh mechanism
- Role-based access control (RBAC)

---

### 2. Spring AI: Ollama Configuration

**Group:** `spring.ai.ollama`

Configuration for Spring AI integration with Ollama local LLM provider.

#### Properties

```yaml
spring:
  ai:
    ollama:
      url: http://localhost:11434                    # Ollama server URL
      model: llama3                                  # Primary LLM model name
      timeout: 30s                                   # Request timeout
      embedding-model: nomic-embed-text              # Model for embeddings (used in RAG)
```

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server endpoint |
| `OLLAMA_MODEL` | `llama3` | Primary model for text generation |
| `OLLAMA_TIMEOUT` | `30s` | Request timeout duration |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Model for vector embeddings |

#### Profile Defaults

- **local**: `url=http://localhost:11434`, `model=llama3`, `timeout=10s`
- **dev**: `url=http://ollama-dev:11434`, `model=llama3`, `timeout=15s`
- **test**: `url=http://localhost:11434`, `model=llama3`, `timeout=5s`
- **prod**: `url=${OLLAMA_URL}`, `model=${OLLAMA_MODEL}` (from environment)

#### Supported Models

- **Text Generation**: `llama2`, `llama3`, `mistral`, `neural-chat`, etc.
- **Embeddings**: `nomic-embed-text`, `all-minilm`, `mxbai-embed-large`, etc.

#### Ollama Setup

```bash
# Install Ollama (https://ollama.com)
# Pull a model
ollama pull llama3
ollama pull nomic-embed-text

# Run Ollama service
ollama serve
```

#### Usage

Used by `ai` and `chat` packages for:
- Intent classification
- Response generation
- Conversation context understanding
- Vector embeddings for RAG retrieval

---

### 3. RAG: Retrieval-Augmented Generation Configuration

**Group:** `rag.retrieval`

Configuration for RAG (Retrieval-Augmented Generation) — a technique that retrieves relevant documents from a knowledge base to augment LLM responses.

#### Properties

```yaml
rag:
  retrieval:
    enabled: true                            # Enable/disable RAG retrieval
    top-k: 5                                 # Number of documents to retrieve
    similarity-threshold: 0.5                # Minimum similarity score (0.0-1.0)
    chunk-size: 500                          # Characters per document chunk
    chunk-overlap: 100                       # Character overlap between chunks
    vector-db: pgvector                      # Vector database type (pgvector, milvus, pinecone, etc.)
```

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RAG_ENABLED` | `true` | Enable RAG retrieval |
| `RAG_TOP_K` | `5` | Number of documents to retrieve |
| `RAG_SIMILARITY_THRESHOLD` | `0.5` | Minimum similarity score |
| `RAG_CHUNK_SIZE` | `500` | Characters per chunk |
| `RAG_CHUNK_OVERLAP` | `100` | Character overlap |
| `RAG_VECTOR_DB` | `pgvector` | Vector database type |

#### Profile Defaults

- **local**: `enabled=true`, `top-k=5`, `similarity-threshold=0.5`, `vector-db=pgvector`
- **dev**: `enabled=true`, `top-k=5`, `similarity-threshold=0.5`, `vector-db=pgvector`
- **test**: `enabled=true`, `top-k=3`, `similarity-threshold=0.5`, `vector-db=pgvector`
- **prod**: All from environment variables

#### Tuning Parameters

**Chunk Size & Overlap**
- Larger chunks: Retain more context but slower retrieval
- Smaller chunks: Faster retrieval but may lose context
- Overlap: Prevents information loss at chunk boundaries

**Top-K**
- Higher values: More documents retrieved, higher recall
- Lower values: Fewer, more relevant results, faster processing

**Similarity Threshold**
- Higher threshold: Only very relevant results included
- Lower threshold: More results included, may include less relevant documents

#### Usage

Used by `rag` and `knowledge` packages for:
- Document/knowledge base retrieval
- Vector similarity search
- Question-answering with context
- Product recommendations from catalog

#### Vector Database Support

- **pgvector** (PostgreSQL extension): Used for local/dev/test
- **Milvus**: Open-source vector database
- **Pinecone**: Managed vector database
- **Weaviate**: Vector search engine

---

## Profile-Specific Configuration

### Local Profile (`application-local.yml`)

Development on local machine with Docker Compose services.

```yaml
# Weak/development secrets acceptable
security.jwt.secret: local-dev-secret-change-in-prod

# Local Ollama
spring.ai.ollama.url: http://localhost:11434
spring.ai.ollama.model: llama3

# RAG with local pgvector
rag.retrieval.vector-db: pgvector
rag.retrieval.enabled: true
```

### Dev Profile (`application-dev.yml`)

Development environment on staging servers.

```yaml
# Use environment variables for secrets
security.jwt.secret: ${JWT_SECRET_DEV}

# Dev service endpoints
spring.ai.ollama.url: http://ollama-dev:11434

# Flyway enabled for schema management
spring.flyway.enabled: true
```

### Test Profile (`application-test.yml`)

Unit and integration tests with deterministic settings.

```yaml
# Fixed test values
security.jwt.secret: test-secret-fixed-for-tests

# Fast timeouts for tests
spring.ai.ollama.timeout: 5s
rag.retrieval.top-k: 3  # Fewer results for faster tests

# Flyway enabled for test schema
spring.flyway.enabled: true
```

### Prod Profile (`application-prod.yml`)

Production environment with all secrets from vault/environment.

```yaml
# All secrets must come from environment/vault
security.jwt.secret: ${JWT_SECRET}

# Production services
spring.ai.ollama.url: ${OLLAMA_URL}

# Flyway enabled for migrations
spring.flyway.enabled: true

# Health details restricted
management.endpoint.health.show-details: when-authorized
```

---

## Setting Configuration Values

### Method 1: Environment Variables

Override any configuration via environment variables:

```bash
export JWT_SECRET="your-secret-key"
export OLLAMA_MODEL="mistral"
export RAG_TOP_K=10

java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=prod
```

### Method 2: Command-Line Arguments

```bash
java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --security.jwt.secret=your-secret \
  --spring.ai.ollama.url=http://ollama-prod:11434
```

### Method 3: External Configuration File

```bash
java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.config.location=file:/etc/aichatbot/application-prod.yml \
  --spring.profiles.active=prod
```

### Method 4: Docker Compose Environment

In `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - JWT_SECRET=my-secret
      - OLLAMA_URL=http://ollama:11434
```

### Method 5: Spring Cloud Config Server

For distributed configuration management (future implementation):

```yaml
spring:
  cloud:
    config:
      uri: http://config-server:8888
```

---

## Secrets Management

### Development (local/dev)

Use weak secrets suitable only for development:

```yaml
security.jwt.secret: dev-secret-change-in-prod
```

### Production

**NEVER commit production secrets to source control.**

Use one of:
1. **Environment Variables** (managed by ops)
2. **Secrets Vault** (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault)
3. **Kubernetes Secrets** (if deployed on K8s)
4. **Encrypted Configuration Files** (with proper access controls)

Example with AWS Secrets Manager:

```bash
export JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id aichatbot/jwt-secret \
  --query SecretString --output text)

java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=prod
```

---

## Configuration Priority Order

Spring Boot resolves configuration in this order (highest to lowest priority):

1. Command-line arguments
2. Environment variables
3. System properties
4. `application-{profile}.yml` file
5. `application.yml` file
6. Default values in code

Example:
```bash
# Environment variable takes precedence
export JWT_SECRET="env-secret"

# Command-line argument overrides environment
java -jar app.jar --security.jwt.secret="cli-secret"
# Result: uses "cli-secret"
```

---

## Configuration Validation

### Verify Configuration at Startup

Check logs for configuration warnings:

```bash
java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=prod 2>&1 | grep -E "Configuration|WARN|ERROR"
```

### Health Check Endpoint

```bash
curl http://localhost:8080/actuator/health -u admin:admin
```

Response includes configuration status:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "kafka": {"status": "UP"},
    "redis": {"status": "UP"}
  }
}
```

### Application Info Endpoint

```bash
curl http://localhost:8080/actuator/info
```

---

## Common Issues & Solutions

### "JWT_SECRET environment variable not set"

**Cause**: Production profile requires JWT_SECRET but not provided.

**Solution**:
```bash
export JWT_SECRET="$(openssl rand -base64 32)"
java -jar app.jar --spring.profiles.active=prod
```

### "Connection refused to Ollama at http://localhost:11434"

**Cause**: Ollama service not running.

**Solution**:
```bash
# Local development
ollama serve &

# Or with Docker Compose
docker compose up -d
```

### "RAG vector database not accessible"

**Cause**: pgvector extension not enabled in PostgreSQL.

**Solution**:
```bash
docker compose exec postgres psql -U aichatbot -d aichatbot_local \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## Next Steps

See `specs/implementation_task_list.md` for remaining configuration tasks:
- [ ] Task #2.8: Product, order, payment, shipping, and CRM service integrations
- [ ] Task #2.9: PostgreSQL, MongoDB, Redis, Kafka, and RabbitMQ configuration groups
- [ ] Task #2.10: Observability and feature flags configuration groups
- [ ] Task #2.11: Document required environment variables and secret names
