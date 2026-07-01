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

### 4. External Service Integrations

**Group:** `integrations`

Configuration for integrations with external e-commerce and business services.

#### Properties

```yaml
integrations:
  product-service:
    enabled: ${PRODUCT_SERVICE_ENABLED:true}
    base-url: ${PRODUCT_SERVICE_URL}
    timeout: ${PRODUCT_SERVICE_TIMEOUT:5s}
    api-key: ${PRODUCT_SERVICE_API_KEY}
  order-service:
    enabled: ${ORDER_SERVICE_ENABLED:true}
    base-url: ${ORDER_SERVICE_URL}
    timeout: ${ORDER_SERVICE_TIMEOUT:5s}
    api-key: ${ORDER_SERVICE_API_KEY}
  payment-service:
    enabled: ${PAYMENT_SERVICE_ENABLED:true}
    base-url: ${PAYMENT_SERVICE_URL}
    timeout: ${PAYMENT_SERVICE_TIMEOUT:10s}
    api-key: ${PAYMENT_SERVICE_API_KEY}
  shipping-service:
    enabled: ${SHIPPING_SERVICE_ENABLED:true}
    base-url: ${SHIPPING_SERVICE_URL}
    timeout: ${SHIPPING_SERVICE_TIMEOUT:5s}
    api-key: ${SHIPPING_SERVICE_API_KEY}
  crm-service:
    enabled: ${CRM_SERVICE_ENABLED:true}
    base-url: ${CRM_SERVICE_URL}
    timeout: ${CRM_SERVICE_TIMEOUT:5s}
    api-key: ${CRM_SERVICE_API_KEY}
```

#### Services

| Service | Purpose | Typical URL | Timeout | API Key |
|---------|---------|-------------|---------|---------|
| product-service | Product catalog, inventory, search | `http://product-api:9001` | 5s | Product API key |
| order-service | Order creation, history, status | `http://order-api:9002` | 5s | Order API key |
| payment-service | Payment processing, refunds | `http://payment-api:9003` | 10s | Payment gateway key |
| shipping-service | Shipping rates, tracking, labels | `http://shipping-api:9004` | 5s | Shipping API key |
| crm-service | Customer profiles, history, preferences | `http://crm-api:9005` | 5s | CRM API key |

#### Profile Defaults

- **local**: All services enabled, localhost URLs, dev API keys
- **dev**: All services enabled, internal URLs, dev API keys
- **test**: All services disabled (use mocks)
- **prod**: All from environment variables, URLs/keys required

#### Usage

Used by `ecommerce` package for:
- Retrieving product information for recommendations
- Creating/tracking orders during conversations
- Processing payments for quick checkout
- Getting shipping options and rates
- Fetching customer profiles and preferences

---

### 5. Database & Messaging Configuration

**Group:** `datasources` and `messaging`

Connection pool and performance tuning for databases and message brokers.

#### Datasources Properties

```yaml
datasources:
  postgresql:
    pool-size: ${DB_POOL_SIZE}           # Connection pool size
    max-idle-time: ${DB_MAX_IDLE_TIME}   # Idle connection timeout
    connection-timeout: ${DB_CONN_TIMEOUT} # Connection acquire timeout
  mongodb:
    max-pool-size: ${MONGO_MAX_POOL_SIZE}
    connection-timeout: ${MONGO_CONN_TIMEOUT}
  redis:
    timeout: ${REDIS_TIMEOUT}
    pool-size: ${REDIS_POOL_SIZE}
```

#### Messaging Properties

```yaml
messaging:
  kafka:
    producer-timeout: ${KAFKA_PRODUCER_TIMEOUT}
    consumer-timeout: ${KAFKA_CONSUMER_TIMEOUT}
    batch-size: ${KAFKA_BATCH_SIZE}
    compression-type: ${KAFKA_COMPRESSION}
  rabbitmq:
    enabled: ${RABBITMQ_ENABLED}
    connection-timeout: ${RABBITMQ_CONN_TIMEOUT}
    request-timeout: ${RABBITMQ_REQUEST_TIMEOUT}
```

#### Profile Defaults

| Property | Local | Dev | Test | Prod |
|----------|-------|-----|------|------|
| PostgreSQL pool-size | 5 | 10 | 2 | 30 |
| MongoDB max-pool-size | 10 | 25 | 5 | 100 |
| Redis pool-size | 4 | 8 | 2 | 16 |
| Kafka batch-size | 16384 | 32768 | 8192 | 32768 |
| Tracing sample-rate | 1.0 | 0.5 | 0.0 | 0.01 |

#### Tuning Guidelines

**PostgreSQL Pool**
- Local/Dev: 5-10 connections (sufficient for single user)
- Test: 2 connections (isolation)
- Prod: 20-50 (depends on load, monitor with max connections)

**MongoDB Pool**
- Local: 10 (plenty for development)
- Prod: 50-100 (one connection per expected concurrent request)

**Kafka**
- Batch Size: Larger batches = higher throughput, higher latency
- Compression: `gzip` (better compression), `snappy` (faster)
- Sample Rate: 0.01 (1%) for prod, 0.5 (50%) for staging, 1.0 (100%) for dev

---

### 6. Observability Configuration

**Group:** `observability`

Monitoring, tracing, logging, and health check configuration.

#### Properties

```yaml
observability:
  metrics:
    enabled: ${METRICS_ENABLED:true}
    include-jvm-metrics: ${INCLUDE_JVM_METRICS:true}
    include-system-metrics: ${INCLUDE_SYSTEM_METRICS:true}
    histogram-percentiles: ${HISTOGRAM_PERCENTILES:0.5,0.95,0.99}
  tracing:
    enabled: ${TRACING_ENABLED:true}
    sample-rate: ${TRACE_SAMPLE_RATE:0.1}
    exporter: ${TRACE_EXPORTER:jaeger}
  logging:
    level: ${LOG_LEVEL:INFO}
    include-request-headers: ${LOG_REQUEST_HEADERS:false}
    include-response-body: ${LOG_RESPONSE_BODY:false}
  health-check:
    include-database: ${HEALTH_CHECK_DB:true}
    include-cache: ${HEALTH_CHECK_CACHE:true}
    include-messaging: ${HEALTH_CHECK_MESSAGING:true}
```

#### Metrics

**JVM Metrics** (enabled with `include-jvm-metrics: true`):
- Memory (heap, non-heap, usage)
- Thread count, peak threads
- Garbage collection (count, time)
- Class loading, unloading

**System Metrics** (enabled with `include-system-metrics: true`):
- CPU usage, load average
- Process uptime
- File descriptor count
- Disk usage

**Application Metrics**:
- HTTP requests (count, latency, status)
- Database operations (count, duration)
- Message processing (count, latency)

#### Tracing

**Sample Rate**:
- `1.0` (100%): All requests traced (development)
- `0.5` (50%): Half traced (staging)
- `0.1` (10%): Every 10th request
- `0.01` (1%): Production (reduce overhead)

**Exporters**:
- `jaeger`: Distributed tracing with Jaeger backend
- `otlp`: OpenTelemetry Protocol (for OpenTelemetry Collector)
- `zipkin`: Zipkin tracing backend

#### Logging Levels

| Level | Usage | Output |
|-------|-------|--------|
| DEBUG | Development | All details, full stack traces |
| INFO | Production | Major events, startup info |
| WARN | Production | Warnings, potential issues |
| ERROR | All | Errors, failures |

#### Health Checks

- `include-database`: Check PostgreSQL/MongoDB connectivity
- `include-cache`: Check Redis connectivity
- `include-messaging`: Check Kafka/RabbitMQ connectivity

#### Profile Defaults

- **local**: All enabled (DEBUG logging, 100% tracing, all metrics)
- **dev**: Most enabled (INFO logging, 50% tracing)
- **test**: Minimal (WARN logging, no tracing, no metrics)
- **prod**: Restricted (WARN logging, 1% tracing, key metrics only)

---

### 7. Feature Flags Configuration

**Group:** `features`

Runtime feature control enabling A/B testing and gradual rollouts without redeployment.

#### Properties

```yaml
features:
  rag-enabled: ${FEATURE_RAG:true}
  intent-classification: ${FEATURE_INTENT_CLASSIFICATION:true}
  recommendations: ${FEATURE_RECOMMENDATIONS:true}
  sentiment-analysis: ${FEATURE_SENTIMENT_ANALYSIS:false}
  escalation-automation: ${FEATURE_AUTO_ESCALATION:false}
  multilingual-support: ${FEATURE_MULTILINGUAL:false}
  kb-auto-indexing: ${FEATURE_KB_AUTO_INDEX:true}
```

#### Feature Descriptions

| Feature | Description | Default | Notes |
|---------|-------------|---------|-------|
| `rag-enabled` | Retrieval-Augmented Generation | `true` | Core feature |
| `intent-classification` | ML-based intent recognition | `true` | Core feature |
| `recommendations` | Product/KB recommendations | `true` | Core feature |
| `sentiment-analysis` | Analyze customer sentiment | `false` | Beta, requires extra resources |
| `escalation-automation` | Auto-escalate complex issues | `false` | Beta, needs tuning |
| `multilingual-support` | Support multiple languages | `false` | Future release |
| `kb-auto-indexing` | Auto-index new KB articles | `true` | Improves RAG |

#### Usage in Code

```java
@Configuration
@ConditionalOnProperty(name = "features.rag-enabled", havingValue = "true")
public class RagFeatureConfig {
    // RAG-specific beans only loaded if feature enabled
}
```

#### Toggling Features at Runtime

```bash
# Enable sentiment analysis for 10% of users
export FEATURE_SENTIMENT_ANALYSIS=true

# Disable escalation automation in prod temporarily
export FEATURE_AUTO_ESCALATION=false

# Start app with feature flags
java -jar app.jar --spring.profiles.active=prod
```

#### Profile Defaults

- **local**: All core features enabled, betas enabled for testing
- **dev**: Core + recommended features enabled
- **test**: Only core features for stable tests
- **prod**: Only stable, proven features enabled

