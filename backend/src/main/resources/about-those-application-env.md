Spring Boot loads these by profile name.

Use them like this:

- `application.yml` = default settings
- `application-local.yml` = used when the `local` profile is active
- `application-dev.yml` = used when the `dev` profile is active
- `application-test.yml` = used when the `test` profile is active
- `application-prod.yml` = used when the `prod` profile is active

How to activate one:

```bash
# local
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

# dev
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

On Windows PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE='local'
mvn spring-boot:run
```

Or from the packaged app:

```bash
java -jar backend.jar --spring.profiles.active=dev
```

What happens:
- Spring reads `application.yml` first
- Then it overlays the active profile file
- Profile-specific values override defaults

In this repo, the relevant files are:
- [backend/src/main/resources/application.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application.yml)
- [backend/src/main/resources/application-local.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-local.yml)
- [backend/src/main/resources/application-dev.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-dev.yml)

For this project specifically:
- `local` is meant for your machine with Docker Compose
- `dev` is meant for a development/staging environment with service hostnames like `postgres-dev`, `kafka-dev`, `ollama-dev`

If you want, I can also show you:
1. the exact env vars each profile expects
2. how to switch the frontend to match `local` vs `dev`
3. how to run the whole stack with the right profile end-to-end