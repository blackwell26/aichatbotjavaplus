# aichatbotjava

AI-powered customer service chatbot for an e-commerce platform.

## Prerequisites

- Java 21
- Maven 3.8+
- Docker and Docker Compose (for local development)

## Quick Start

### 1. Build the project

```bash
# Clean build (skip tests for faster builds during development)
mvn -DskipTests clean package

# Full build with tests
mvn clean package

# From the backend directory
cd backend && mvn clean package
```

### 2. Run the backend

```bash
# Using Maven with a specific profile
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

# Using the JAR directly
java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar --spring.profiles.active=local

# With explicit datasource properties
java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=local \
  --spring.datasource.url=jdbc:postgresql://localhost:5432/aichatbot_local \
  --spring.datasource.username=aichatbot \
  --spring.datasource.password=changeme
```

### 3. Start local services

```bash
# Start all services (Postgres, MongoDB, Redis, Kafka, Prometheus, Grafana)
docker compose up -d

# Start the optional debugging and tracing services
docker compose --profile debug --profile logs --profile tracing up -d

# Pull the configured Ollama model
docker compose --profile ollama-init up ollama-pull

# Check status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Stop all services
docker compose down

# Reset everything including named volumes
docker compose down -v
```

### 4. Access endpoints

- **Backend**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health
- **Metrics**: http://localhost:8080/actuator/prometheus
- **Grafana Dashboard**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kafka UI**: http://localhost:8088
- **OpenSearch Dashboards**: http://localhost:5601
- **Jaeger**: http://localhost:16686

## Standard Commands

### Build Commands

```bash
# Clean and build (skip tests)
mvn -DskipTests clean package

# Full build with tests
mvn clean package

# Compile only
mvn clean compile

# Build a specific module
cd backend && mvn package
```

### Test Commands

```bash
# Run all tests
mvn test

# Run a specific test class
mvn test -Dtest=ChatbotApplicationTest

# Run tests matching a pattern
mvn test -Dtest=*Controller

# Skip tests during build
mvn -DskipTests package

# Run tests without building
mvn test -DskipTests=false
```

### Code Quality & Linting

```bash
# Check code with Maven plugins (requires plugins configured in pom.xml)
# Currently using compiler:compile with parameters=true for Java compile checks

# Compile with strict checks
mvn clean compile

# Check for common issues during test phase
mvn test
```

### Package Commands

```bash
# Create deployable JAR (Spring Boot fat JAR)
mvn -DskipTests package

# Location of built artifact
# backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar

# Create source JAR for distribution
mvn source:jar

# Create Javadoc
mvn javadoc:jar
```

### Dependency Management

```bash
# Check for dependency updates
mvn versions:display-dependency-updates

# Display full dependency tree
mvn dependency:tree

# Analyze unused dependencies
mvn dependency:analyze
```

### Flyway Database Migrations

```bash
# Apply migrations (auto-applied at startup in dev/prod profiles)
# For local development, use the Docker container:
docker compose exec -T flyway flyway:migrate

# Or manually with Flyway CLI:
mvn org.flywaydb:flyway-maven-plugin:migrate \
  -Dflyway.configFiles=backend/src/main/resources/application-local.yml
```

### Docker Compose Reset and Inspection

```bash
# Restart the stack
docker compose restart

# Inspect one service
docker compose logs -f postgres
docker compose logs -f kafka
docker compose logs -f ollama

# Recreate the stack from scratch
docker compose down -v
docker compose up -d
```

### Clean

```bash
# Remove build artifacts and generated files
mvn clean

# Full clean (also removes IDE metadata)
mvn clean && rm -rf .m2-home

# Prune Docker resources (use with caution)
docker compose down -v  # removes volumes
```

## Project Structure

```
aichatbotjava/
├── backend/                          # Spring Boot backend application
│   ├── src/main/java/com/company/chatbot/  # Application code
│   ├── src/main/resources/           # Configuration and assets
│   │   ├── application.yml           # Base configuration
│   │   ├── application-local.yml     # Local dev profile
│   │   ├── application-dev.yml       # Dev environment profile
│   │   ├── application-test.yml      # Test profile
│   │   ├── application-prod.yml      # Production profile
│   │   └── db/migration/             # Flyway database migrations
│   ├── src/test/java/com/company/chatbot/  # Test code
│   ├── pom.xml                       # Maven configuration
│   └── README.md                     # Backend-specific instructions
├── docker-compose.yml                # Local development services
├── specs/                            # Requirements and design docs
│   ├── requirements.md
│   ├── technical_design_specifications.md
│   └── implementation_task_list.md
└── README.md                         # This file
```

## Configuration

### Application Profiles

The backend supports multiple Spring profiles:

- **`local`**: Local development with Docker services
- **`dev`**: Development environment configuration
- **`test`**: Test environment configuration
- **`prod`**: Production environment configuration

### Environment Variables

Key environment variables (can override `application-*.yml`):

```bash
# Spring Boot
SPRING_PROFILES_ACTIVE=local

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/aichatbot_local
SPRING_DATASOURCE_USERNAME=aichatbot
SPRING_DATASOURCE_PASSWORD=changeme

# MongoDB
SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/aichatbot_local

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Spring AI (Ollama)
SPRING_AI_OLLAMA_URL=http://localhost:11434
SPRING_AI_OLLAMA_MODEL=llama3
```

## Development Workflow

### 1. Setup local environment

```bash
# Start Docker services
docker compose up -d

# Verify all services are running
docker compose ps
```

### 2. Build and run the backend

```bash
# Build
mvn -DskipTests clean package

# Run with local profile
java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar --spring.profiles.active=local
```

### 3. Verify health

```bash
# Check backend health
curl http://localhost:8080/actuator/health

# View metrics in Prometheus
curl http://localhost:9090/api/v1/targets

# Open Grafana dashboard
# http://localhost:3000 (admin/admin)
```

### 4. Development iteration

```bash
# Watch and rebuild (in dev mode, requires LiveReload or similar)
mvn clean compile spring-boot:run

# Or use IDE hot reload (IntelliJ IDEA, VS Code with Spring Boot Extension)
```

## Troubleshooting

### Backend fails to start

- Check Docker Compose services are running: `docker compose ps`
- Verify port 8080 is available: `lsof -i :8080`
- Check logs: `java -jar backend/target/aichatbotjava-0.1.0-SNAPSHOT.jar --spring.profiles.active=local 2>&1 | head -100`

### Database connection errors

- Verify Postgres is running: `docker compose logs postgres`
- Check credentials in `backend/src/main/resources/application-local.yml`
- Manually test connection: `psql -h localhost -U aichatbot -d aichatbot_local`

### Prometheus not scraping metrics

- Verify backend is running: `curl http://localhost:8080/actuator/health`
- Check Prometheus config: `backend/docker/prometheus.yml`
- View Prometheus targets: http://localhost:9090/targets

## Additional Resources

- **Spring Boot Documentation**: https://spring.io/projects/spring-boot
- **Spring Data JPA**: https://spring.io/projects/spring-data-jpa
- **Spring AI**: https://spring.io/projects/spring-ai
- **Flyway**: https://flywaydb.org/
- **Prometheus**: https://prometheus.io/
- **Grafana**: https://grafana.com/

## Contributing

See `specs/implementation_task_list.md` for the development roadmap and task tracking.
