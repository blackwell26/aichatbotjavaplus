AI Chatbot backend — local run and profile instructions

Run with a specific Spring profile (local/dev/test/prod):

- Maven run (uses the specified profile):
  SPRING_PROFILES_ACTIVE=local ./mvnw -f backend spring-boot:run

- Or with Maven directly:
  SPRING_PROFILES_ACTIVE=dev mvn -f backend spring-boot:run

Build artifact:
  cd backend && mvn -DskipTests package

Notes:
- application-*.yml files contain example connection settings. Use environment variables or a secret manager for production credentials.
- Flyway migrations live in src/main/resources/db/migration and are applied automatically at startup when flyway-core is on the classpath.
- For local development prefer Docker Compose (services: postgres, mongo, redis, kafka, ollama). See the repo specs/ for required services.
