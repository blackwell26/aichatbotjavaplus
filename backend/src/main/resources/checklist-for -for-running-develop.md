Local developer checklist

1. Start dependencies
```powershell
docker compose up -d
```

2. Run backend in `local`
```powershell
$env:SPRING_PROFILES_ACTIVE='local'
cd backend
mvn spring-boot:run
```

3. Run frontend
```powershell
cd frontend
npm install
npm start
```

4. Verify health
```powershell
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/v1/health
```

5. Optional services
```powershell
docker compose --profile debug --profile logs --profile tracing up -d
docker compose --profile ollama-init up ollama-pull
```

Dev/staging checklist

1. Set backend profile to `dev`
```powershell
$env:SPRING_PROFILES_ACTIVE='dev'
$env:DB_PASSWORD_DEV='...'
$env:JWT_SECRET_DEV='...'
```

2. Provide dev service endpoints through your dev environment
- `postgres-dev`
- `mongodb-dev`
- `redis-dev`
- `kafka-dev`
- `ollama-dev`

3. Build and deploy backend with the `dev` profile
- Use the dev environment’s container or deployment pipeline
- Confirm Flyway is enabled in `application-dev.yml`

4. Point frontend to the dev/staging API
- Use the staging environment file or equivalent build config
- API should point at the dev cluster URL, not localhost

5. Verify after deploy
```powershell
curl https://<dev-host>/actuator/health
curl https://<dev-host>/api/v1/health
```

What to check after startup

- Backend health returns `UP`
- Database migrations succeed
- Kafka, Redis, and Mongo connections are healthy
- Ollama responds
- Frontend loads and can reach the API
- Chat websocket connects without auth or CORS errors

Relevant files:
- [docker-compose.yml](/C:/_Dev/chatbot/aichatbotjava/docker-compose.yml)
- [backend/src/main/resources/application-local.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-local.yml)
- [backend/src/main/resources/application-dev.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-dev.yml)
- [frontend/src/environments/environment.development.ts](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.development.ts)
- [frontend/src/environments/environment.staging.ts](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.staging.ts)

If you want, I can turn this into a single exact runbook for your machine with the right commands in order.