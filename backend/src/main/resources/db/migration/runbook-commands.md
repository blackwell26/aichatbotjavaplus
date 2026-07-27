Runbook for your machine

1. Start the local infrastructure
```powershell
cd C:\_Dev\chatbot\aichatbotjava
docker compose up -d
```

2. Wait for services to be healthy
```powershell
docker compose ps
docker compose logs -f postgres
docker compose logs -f kafka
docker compose logs -f ollama
```

3. Start the backend in `local`
```powershell
$env:SPRING_PROFILES_ACTIVE='local'
cd C:\_Dev\chatbot\aichatbotjava\backend
mvn spring-boot:run
```

4. Start the frontend in development mode
```powershell
cd C:\_Dev\chatbot\aichatbotjava\frontend
npm install
npm start
```

5. Verify backend health
```powershell
curl http://localhost:8080/actuator/health
```

6. Verify the API is responding
```powershell
curl http://localhost:8080/api/v1/health
```

7. Optional extras
```powershell
cd C:\_Dev\chatbot\aichatbotjava
docker compose --profile debug --profile logs --profile tracing up -d
docker compose --profile ollama-init up ollama-pull
```

8. If something is off, check the profile files
- Local backend config: [backend/src/main/resources/application-local.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-local.yml)
- Dev backend config: [backend/src/main/resources/application-dev.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-dev.yml)
- Local frontend config: [frontend/src/environments/environment.development.ts](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.development.ts)
- Staging/dev frontend config: [frontend/src/environments/environment.staging.ts](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.staging.ts)

If you want, I can also give you the matching `dev`/staging runbook with the exact environment variables you need to set before deployment.