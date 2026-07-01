# Environment Variables & Secrets Reference

This document lists all environment variables and secrets required for the AI Chatbot backend across different deployment environments.

## Quick Reference: Required Variables by Environment

### Local Development (Profile: `local`)

Minimal secrets needed (defaults provided):

```bash
# These are optional; defaults are used for local dev
SPRING_PROFILES_ACTIVE=local
# All other variables have safe dev defaults
```

### Development (Profile: `dev`)

Standard staging/internal development:

```bash
export SPRING_PROFILES_ACTIVE=dev
export JWT_SECRET_DEV="<dev-secret-key>"

# Service URLs (typically internal hostnames)
export PRODUCT_SERVICE_URL="http://product-service-dev:9001"
export ORDER_SERVICE_URL="http://order-service-dev:9002"
export PAYMENT_SERVICE_URL="http://payment-service-dev:9003"
export SHIPPING_SERVICE_URL="http://shipping-service-dev:9004"
export CRM_SERVICE_URL="http://crm-service-dev:9005"

# Database
export DB_PASSWORD_DEV="<dev-db-password>"
```

### Test (Profile: `test`)

CI/integration test environment:

```bash
export SPRING_PROFILES_ACTIVE=test
# All test values are fixed and provided in application-test.yml
# No external variables typically needed
```

### Production (Profile: `prod`)

**ALL variables required** (no defaults allowed):

```bash
export SPRING_PROFILES_ACTIVE=prod

# Security
export JWT_SECRET="<strong-random-secret>"
export JWT_EXPIRATION="3600"
export JWT_REFRESH_EXPIRATION="604800"
export JWT_ISSUER="aichatbot"
export JWT_AUDIENCE="aichatbot-users"

# Database
export DATABASE_URL="jdbc:postgresql://prod-db:5432/aichatbot"
export DATABASE_USERNAME="<db-user>"
export DATABASE_PASSWORD="<db-password>"

# MongoDB
export MONGODB_URI="mongodb://<user>:<password>@prod-mongo:27017/aichatbot?authSource=admin"

# Redis
export REDIS_HOST="prod-redis"
export REDIS_PORT="6379"

# Kafka
export KAFKA_BOOTSTRAP_SERVERS="kafka1:9092,kafka2:9092,kafka3:9092"

# Ollama / AI Models
export OLLAMA_URL="http://ollama-prod:11434"
export OLLAMA_MODEL="llama3"
export OLLAMA_TIMEOUT="30s"
export OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

# Service Integrations
export PRODUCT_SERVICE_ENABLED="true"
export PRODUCT_SERVICE_URL="https://api.product-service.com"
export PRODUCT_SERVICE_API_KEY="<product-api-key>"

export ORDER_SERVICE_ENABLED="true"
export ORDER_SERVICE_URL="https://api.order-service.com"
export ORDER_SERVICE_API_KEY="<order-api-key>"

export PAYMENT_SERVICE_ENABLED="true"
export PAYMENT_SERVICE_URL="https://api.payment-service.com"
export PAYMENT_SERVICE_API_KEY="<payment-api-key>"

export SHIPPING_SERVICE_ENABLED="true"
export SHIPPING_SERVICE_URL="https://api.shipping-service.com"
export SHIPPING_SERVICE_API_KEY="<shipping-api-key>"

export CRM_SERVICE_ENABLED="true"
export CRM_SERVICE_URL="https://api.crm-service.com"
export CRM_SERVICE_API_KEY="<crm-api-key>"

# Database Connection Pools
export DB_POOL_SIZE="30"
export DB_MAX_IDLE_TIME="30m"
export DB_CONN_TIMEOUT="30s"
export MONGO_MAX_POOL_SIZE="100"
export MONGO_CONN_TIMEOUT="10s"
export REDIS_TIMEOUT="5s"
export REDIS_POOL_SIZE="16"

# Kafka Configuration
export KAFKA_PRODUCER_TIMEOUT="10s"
export KAFKA_CONSUMER_TIMEOUT="30s"
export KAFKA_BATCH_SIZE="32768"
export KAFKA_COMPRESSION="snappy"

# Observability
export METRICS_ENABLED="true"
export INCLUDE_JVM_METRICS="true"
export INCLUDE_SYSTEM_METRICS="true"
export HISTOGRAM_PERCENTILES="0.5,0.95,0.99"

export TRACING_ENABLED="true"
export TRACE_SAMPLE_RATE="0.01"  # 1% for production
export TRACE_EXPORTER="jaeger"

export LOG_LEVEL="WARN"
export LOG_REQUEST_HEADERS="false"
export LOG_RESPONSE_BODY="false"

export HEALTH_CHECK_DB="true"
export HEALTH_CHECK_CACHE="true"
export HEALTH_CHECK_MESSAGING="true"

# Feature Flags
export FEATURE_RAG="true"
export FEATURE_INTENT_CLASSIFICATION="true"
export FEATURE_RECOMMENDATIONS="true"
export FEATURE_SENTIMENT_ANALYSIS="false"
export FEATURE_AUTO_ESCALATION="false"
export FEATURE_MULTILINGUAL="false"
export FEATURE_KB_AUTO_INDEX="true"
```

---

## Complete Environment Variable Reference

### Security & Authentication

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `JWT_SECRET` | Prod | — | Secret key for signing JWT tokens | `"$(openssl rand -base64 32)"` |
| `JWT_EXPIRATION` | No | `3600` | Access token lifetime (seconds) | `3600` |
| `JWT_REFRESH_EXPIRATION` | No | `604800` | Refresh token lifetime (seconds) | `604800` |
| `JWT_ISSUER` | No | `aichatbot` | Token issuer claim | `"aichatbot"` |
| `JWT_AUDIENCE` | No | `aichatbot-users` | Token audience claim | `"aichatbot-users"` |

**Secrets Management**: Store in Vault, AWS Secrets Manager, or K8s Secrets

---

### Database Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `DATABASE_URL` | Prod | `jdbc:postgresql://localhost:5432/aichatbot_local` | PostgreSQL connection URL | `"jdbc:postgresql://prod-db:5432/aichatbot"` |
| `DATABASE_USERNAME` | Prod | `aichatbot` | Database user | `"aichatbot_prod"` |
| `DATABASE_PASSWORD` | Prod | `changeme` | Database password | `"$(aws secretsmanager get-secret-value...)"` |
| `DB_POOL_SIZE` | No | `10` (local), `30` (prod) | Connection pool size | `30` |
| `DB_MAX_IDLE_TIME` | No | `30m` | Idle connection timeout | `30m` |
| `DB_CONN_TIMEOUT` | No | `30s` | Connection acquire timeout | `30s` |

**Notes**:
- Use PostgreSQL 13+ with pgvector extension
- Connection pool: 20-50 for production (depends on load)
- Test with: `psql -h $DATABASE_URL -U $DATABASE_USERNAME`

---

### MongoDB Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `MONGODB_URI` | Prod | `mongodb://localhost:27017/aichatbot_local` | MongoDB connection URI | `"mongodb://user:pass@prod-mongo:27017/aichatbot"` |
| `MONGO_MAX_POOL_SIZE` | No | `10` (local), `100` (prod) | Connection pool size | `100` |
| `MONGO_CONN_TIMEOUT` | No | `10s` | Connection timeout | `10s` |

**URI Format**: `mongodb://[user[:password]@]host[:port][/database][?options]`

---

### Redis Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `REDIS_HOST` | Prod | `localhost` | Redis server hostname | `"prod-redis.internal"` |
| `REDIS_PORT` | No | `6379` | Redis port | `6379` |
| `REDIS_TIMEOUT` | No | `5s` | Request timeout | `5s` |
| `REDIS_POOL_SIZE` | No | `4` (local), `16` (prod) | Connection pool size | `16` |

**Notes**:
- For cluster: Use `redis-cluster://host1:6379,host2:6379`
- Test with: `redis-cli -h $REDIS_HOST ping`

---

### Kafka Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `KAFKA_BOOTSTRAP_SERVERS` | Prod | `localhost:9092` | Kafka broker addresses | `"kafka1:9092,kafka2:9092,kafka3:9092"` |
| `KAFKA_PRODUCER_TIMEOUT` | No | `10s` | Producer request timeout | `10s` |
| `KAFKA_CONSUMER_TIMEOUT` | No | `30s` | Consumer session timeout | `30s` |
| `KAFKA_BATCH_SIZE` | No | `32768` | Producer batch size (bytes) | `32768` |
| `KAFKA_COMPRESSION` | No | `snappy` | Compression type (gzip/snappy) | `snappy` |

**Test**: `kafkacat -b $KAFKA_BOOTSTRAP_SERVERS -L` (list brokers)

---

### Spring AI & Ollama

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `OLLAMA_URL` | No | `http://localhost:11434` | Ollama server endpoint | `"http://ollama-prod:11434"` |
| `OLLAMA_MODEL` | No | `llama2` | Primary LLM model name | `"llama3"` |
| `OLLAMA_TIMEOUT` | No | `30s` | Request timeout | `30s` |
| `OLLAMA_EMBEDDING_MODEL` | No | `nomic-embed-text` | Model for embeddings | `"nomic-embed-text"` |

**Available Models**:
- Text: `llama2`, `llama3`, `mistral`, `neural-chat`, `dolphin-mixtral`
- Embeddings: `nomic-embed-text`, `all-minilm`, `mxbai-embed-large`

**Setup**:
```bash
ollama pull llama3
ollama pull nomic-embed-text
ollama serve &
```

---

### RAG Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `RAG_ENABLED` | No | `true` | Enable RAG retrieval | `"true"` |
| `RAG_TOP_K` | No | `5` | Number of documents to retrieve | `5` |
| `RAG_SIMILARITY_THRESHOLD` | No | `0.5` | Min similarity score (0-1) | `0.5` |
| `RAG_CHUNK_SIZE` | No | `500` | Characters per chunk | `500` |
| `RAG_CHUNK_OVERLAP` | No | `100` | Overlap between chunks | `100` |
| `RAG_VECTOR_DB` | No | `pgvector` | Vector DB type | `pgvector` |

**Supported Vector DBs**:
- `pgvector`: PostgreSQL extension (built-in)
- `milvus`: Standalone vector database
- `pinecone`: Managed cloud service
- `weaviate`: Open-source vector search

---

### External Service Integrations

#### Product Service
| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `PRODUCT_SERVICE_ENABLED` | No | `true` | Enable integration | `"true"` |
| `PRODUCT_SERVICE_URL` | Prod if enabled | `http://localhost:9001` | Service endpoint | `"https://api.products.com"` |
| `PRODUCT_SERVICE_TIMEOUT` | No | `5s` | Request timeout | `5s` |
| `PRODUCT_SERVICE_API_KEY` | Prod | — | API authentication key | `"sk_prod_..."` |

#### Order Service
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ORDER_SERVICE_ENABLED` | No | `true` | Enable integration |
| `ORDER_SERVICE_URL` | Prod if enabled | `http://localhost:9002` | Service endpoint |
| `ORDER_SERVICE_TIMEOUT` | No | `5s` | Request timeout |
| `ORDER_SERVICE_API_KEY` | Prod | — | API authentication key |

#### Payment Service
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAYMENT_SERVICE_ENABLED` | No | `true` | Enable integration |
| `PAYMENT_SERVICE_URL` | Prod if enabled | `http://localhost:9003` | Service endpoint |
| `PAYMENT_SERVICE_TIMEOUT` | No | `10s` | Request timeout (longer for payment) |
| `PAYMENT_SERVICE_API_KEY` | Prod | — | API authentication key |

#### Shipping Service
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHIPPING_SERVICE_ENABLED` | No | `true` | Enable integration |
| `SHIPPING_SERVICE_URL` | Prod if enabled | `http://localhost:9004` | Service endpoint |
| `SHIPPING_SERVICE_TIMEOUT` | No | `5s` | Request timeout |
| `SHIPPING_SERVICE_API_KEY` | Prod | — | API authentication key |

#### CRM Service
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CRM_SERVICE_ENABLED` | No | `true` | Enable integration |
| `CRM_SERVICE_URL` | Prod if enabled | `http://localhost:9005` | Service endpoint |
| `CRM_SERVICE_TIMEOUT` | No | `5s` | Request timeout |
| `CRM_SERVICE_API_KEY` | Prod | — | API authentication key |

---

### Observability & Monitoring

#### Metrics
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `METRICS_ENABLED` | No | `true` | Enable metrics collection |
| `INCLUDE_JVM_METRICS` | No | `true` | Include JVM memory, threads, GC |
| `INCLUDE_SYSTEM_METRICS` | No | `true` | Include CPU, disk, process metrics |
| `HISTOGRAM_PERCENTILES` | No | `0.5,0.95,0.99` | Percentiles to track |

#### Tracing
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TRACING_ENABLED` | No | `true` | Enable distributed tracing |
| `TRACE_SAMPLE_RATE` | No | `0.1` | Sampling rate (0.0-1.0) |
| `TRACE_EXPORTER` | No | `jaeger` | Exporter type (jaeger, otlp, zipkin) |

**Sample Rate Recommendations**:
- Dev: `1.0` (100% - all requests)
- Staging: `0.5` (50% - every other)
- Prod: `0.01` (1% - reduce overhead)

#### Logging
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `INFO` | Root log level (DEBUG/INFO/WARN/ERROR) |
| `LOG_REQUEST_HEADERS` | No | `false` | Log incoming request headers |
| `LOG_RESPONSE_BODY` | No | `false` | Log response bodies (security risk) |

**Log Levels**:
- `DEBUG`: Development (verbose output)
- `INFO`: Production (startup, key events)
- `WARN`: Production (warnings, potential issues)
- `ERROR`: All (errors only)

#### Health Checks
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HEALTH_CHECK_DB` | No | `true` | Check database connectivity |
| `HEALTH_CHECK_CACHE` | No | `true` | Check Redis connectivity |
| `HEALTH_CHECK_MESSAGING` | No | `true` | Check Kafka/RabbitMQ connectivity |

---

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FEATURE_RAG` | No | `true` | Enable RAG retrieval |
| `FEATURE_INTENT_CLASSIFICATION` | No | `true` | Enable intent detection |
| `FEATURE_RECOMMENDATIONS` | No | `true` | Enable recommendations |
| `FEATURE_SENTIMENT_ANALYSIS` | No | `false` | Enable sentiment analysis (beta) |
| `FEATURE_AUTO_ESCALATION` | No | `false` | Enable auto-escalation (beta) |
| `FEATURE_MULTILINGUAL` | No | `false` | Enable multilingual support (future) |
| `FEATURE_KB_AUTO_INDEX` | No | `true` | Enable auto-indexing of KB articles |

---

## Loading Variables from Secrets Manager

### AWS Secrets Manager

```bash
#!/bin/bash

# Fetch all secrets for production
export JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id aichatbot/jwt-secret \
  --query SecretString --output text)

export DATABASE_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id aichatbot/db-password \
  --query SecretString --output text)

export PRODUCT_SERVICE_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id aichatbot/product-api-key \
  --query SecretString --output text)

java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=prod
```

### HashiCorp Vault

```bash
#!/bin/bash

export VAULT_ADDR="https://vault.example.com"
export VAULT_TOKEN="<service-token>"

# Fetch secrets from Vault
export JWT_SECRET=$(vault kv get -field=secret secret/aichatbot/jwt)
export DATABASE_PASSWORD=$(vault kv get -field=password secret/aichatbot/database)

java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=prod
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: aichatbot-secrets
  namespace: default
type: Opaque
stringData:
  JWT_SECRET: "<strong-secret-key>"
  DATABASE_PASSWORD: "<db-password>"
  PRODUCT_SERVICE_API_KEY: "<api-key>"
---
apiVersion: v1
kind: Pod
metadata:
  name: aichatbot-backend
spec:
  containers:
  - name: backend
    image: aichatbot:latest
    env:
    - name: JWT_SECRET
      valueFrom:
        secretKeyRef:
          name: aichatbot-secrets
          key: JWT_SECRET
    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: aichatbot-secrets
          key: DATABASE_PASSWORD
```

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All required variables set (see "Production" section above)
- [ ] JWT_SECRET is strong (>32 characters, random)
- [ ] Database credentials correct and user has proper permissions
- [ ] Ollama service accessible and model downloaded
- [ ] All external service URLs reachable
- [ ] API keys valid and have required permissions
- [ ] Certificate paths valid (if using TLS)
- [ ] Log level set to WARN or ERROR
- [ ] Trace sampling rate <= 0.01 (1%)
- [ ] Feature flags configured for stability
- [ ] Health check endpoints responding

### Pre-deployment Verification

```bash
# Test database connection
psql -h $DATABASE_URL -U $DATABASE_USERNAME -c "SELECT 1;"

# Test Redis
redis-cli -h $REDIS_HOST ping

# Test Kafka
kafkacat -b $KAFKA_BOOTSTRAP_SERVERS -L

# Test Ollama
curl $OLLAMA_URL/api/tags

# Start app and check health
java -jar app.jar --spring.profiles.active=prod &
sleep 5
curl http://localhost:8080/actuator/health
```

---

## Security Best Practices

1. **Never commit secrets to source control**
   - Use `.gitignore` to exclude config files with secrets
   - Use environment variables or secrets manager

2. **Rotate secrets regularly**
   - JWT_SECRET: Every 30-90 days
   - API keys: Quarterly
   - Database passwords: Every 6 months

3. **Restrict secret access**
   - Only deployment/CI systems should have access
   - Use IAM roles instead of static credentials
   - Audit secret access logs

4. **Use strong secrets**
   - Minimum 32 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - Generated cryptographically (not human-memorable)

5. **Encrypt in transit**
   - Use HTTPS for all external service calls
   - Enable TLS for database connections
   - Use encrypted tunnels for remote access

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check credentials
echo $DATABASE_USERNAME
echo $DATABASE_PASSWORD

# Verify connectivity
psql -h $(echo $DATABASE_URL | cut -d: -f3 | tr -d '/') \
  -U $DATABASE_USERNAME -c "SELECT 1;"
```

### "Ollama model not found"
```bash
# List available models
curl $OLLAMA_URL/api/tags

# Pull required model
curl -X POST $OLLAMA_URL/api/pull -d '{"name":"'$OLLAMA_MODEL'"}'
```

### "Service integration timeout"
```bash
# Increase timeout
export PRODUCT_SERVICE_TIMEOUT="10s"

# Test connectivity
curl -v $PRODUCT_SERVICE_URL/health
```

---

## See Also

- `backend/CONFIG.md` - Configuration groups details
- `backend/README.md` - Backend setup instructions
- `README.md` - Project overview
