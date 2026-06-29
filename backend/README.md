# AI Chatbot Backend

Spring Boot 3.x backend for the AI-powered customer service chatbot.

## Quick Start

### Build

```bash
# Clean build (skip tests for speed)
mvn -DskipTests clean package

# Full build with tests
mvn clean package
```

### Run

```bash
# Using Maven with local profile
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

# Using the built JAR
java -jar target/aichatbotjava-0.1.0-SNAPSHOT.jar --spring.profiles.active=local
```

### Services

Start the local development stack:

```bash
# From the repo root
docker compose up -d
```

This starts:
- **PostgreSQL** (pgvector): postgresql://localhost:5432/aichatbot_local
- **MongoDB**: mongodb://localhost:27017/aichatbot_local
- **Redis**: redis://localhost:6379
- **Kafka**: localhost:9092
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

## Standard Commands

### Build

```bash
# Clean compile
mvn clean compile

# Build without tests (for development)
mvn -DskipTests clean package

# Full build with tests
mvn clean package

# Display dependency tree
mvn dependency:tree
```

### Test

```bash
# Run all tests
mvn test

# Run a specific test
mvn test -Dtest=TestClassName

# Run tests matching a pattern
mvn test -Dtest=*Service

# Skip tests during package
mvn -DskipTests package
```

### Package

```bash
# Create deployable JAR
mvn -DskipTests clean package

# Location: target/aichatbotjava-0.1.0-SNAPSHOT.jar

# Package with tests
mvn clean package
```

### Code Quality

```bash
# Compile with strict checks (configured in pom.xml)
mvn clean compile

# Check for compiler warnings
mvn -X clean compile 2>&1 | grep -i warning
```

### Dependencies

```bash
# Check for dependency updates
mvn versions:display-dependency-updates

# Display dependency tree
mvn dependency:tree

# Analyze unused/undeclared dependencies
mvn dependency:analyze
```

## Configuration

### Application Profiles

Profiles in `src/main/resources/`:

- `application.yml` - Base configuration
- `application-local.yml` - Local development (with Flyway disabled)
- `application-dev.yml` - Development environment
- `application-test.yml` - Test environment
- `application-prod.yml` - Production environment

### Database Migrations

Flyway migrations are stored in `src/main/resources/db/migration/`:

```bash
# Migrations are auto-applied at startup (enabled in dev/prod profiles)
# For local dev, migrations are applied externally via Docker:

# Manual Flyway run (if auto-migrate is enabled)
mvn org.flywaydb:flyway-maven-plugin:migrate
```

### Environment Variables

```bash
# Override any application.yml setting:
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/aichatbot_local
SPRING_DATASOURCE_USERNAME=aichatbot
SPRING_DATASOURCE_PASSWORD=changeme

SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/aichatbot_local

SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

SPRING_AI_OLLAMA_URL=http://localhost:11434
SPRING_AI_OLLAMA_MODEL=llama3

# Active profile
SPRING_PROFILES_ACTIVE=local
```

## Run Modes

### Development with Maven

```bash
# Watch and rebuild (requires IDE or LiveReload)
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

# Note: For hot reload, use IntelliJ IDEA, VS Code with Spring Boot Extension, or similar
```

### Production JAR

```bash
# Build the JAR
mvn -DskipTests clean package

# Run with production profile
java -jar target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --spring.datasource.url=jdbc:postgresql://prod-host:5432/aichatbot \
  --spring.datasource.username=prod_user \
  --spring.datasource.password=<secret>
```

## Observability

### Health Check

```bash
curl http://localhost:8080/actuator/health
```

### Prometheus Metrics

```bash
# View metrics in Prometheus format
curl http://localhost:8080/actuator/prometheus

# Query in Prometheus web UI
http://localhost:9090

# Available metrics:
# - jvm_memory_used_bytes
# - http_requests_total
# - tomcat_sessions_active_max
```

### Grafana Dashboards

Open http://localhost:3000 (admin/admin)

- **Backend Metrics**: Sample dashboard showing JVM and HTTP metrics
- **Prometheus** datasource is pre-configured

## Troubleshooting

### "Connection refused" errors

```bash
# Verify Docker services are running
docker compose ps

# Start services if needed
docker compose up -d

# Check specific service logs
docker compose logs postgres
docker compose logs mongo
```

### "Port 8080 already in use"

```bash
# Find process using port 8080
lsof -i :8080

# Kill process (replace PID)
kill -9 <PID>

# Or use a different port
java -jar target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --server.port=8081 \
  --spring.profiles.active=local
```

### Flyway migration errors

In local profile, Flyway auto-migrate is disabled. Migrations are applied via Docker:

```bash
# Check migration status
docker compose logs flyway

# Manually trigger migrations if needed (from repo root)
docker compose up flyway
```

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/company/chatbot/
│   │   │   ├── api/              # REST endpoints
│   │   │   ├── auth/             # Authentication & security
│   │   │   ├── chat/             # Chat logic
│   │   │   ├── intent/           # Intent recognition
│   │   │   ├── rag/              # RAG (Retrieval-Augmented Generation)
│   │   │   ├── ai/               # AI model integration
│   │   │   ├── config/           # Spring configuration
│   │   │   ├── persistence/      # Data access layer
│   │   │   ├── messaging/        # Event/message handling
│   │   │   └── ...
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-*.yml
│   │       └── db/migration/     # Flyway migrations
│   └── test/
│       └── java/com/company/chatbot/
├── docker/
│   └── prometheus.yml            # Prometheus scrape config
├── logs/
│   └── backend.log              # Runtime logs (local only)
├── pom.xml                       # Maven configuration
└── README.md                     # This file
```

## Dependencies

Core dependencies (see `pom.xml` for full list):

- **Spring Boot 3.3.2**
- **Spring Data JPA** - ORM for PostgreSQL
- **Spring Data MongoDB** - Document store
- **Spring Data Redis** - Caching and sessions
- **Spring Kafka** - Event streaming
- **Spring AI** - AI/LLM integration (Ollama provider)
- **Spring Security** - Authentication & authorization
- **Resilience4j** - Circuit breakers, retries
- **Micrometer + Prometheus** - Observability
- **Flyway** - Database migrations
- **Testcontainers** - Integration testing

## Next Steps

See `specs/implementation_task_list.md` for development roadmap.

Key upcoming tasks:
- [ ] REST API endpoints for chat
- [ ] Intent classification
- [ ] RAG with vector search
- [ ] User authentication (JWT)
- [ ] Message queue processing
- [ ] Analytics and logging
