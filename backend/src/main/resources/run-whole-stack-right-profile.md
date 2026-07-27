1. Exact env vars by profile

`application-local.yml` uses localhost defaults and can run with only a few optional variables:
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `MONGO_HOST`, `MONGO_PORT`, `MONGO_USER`, `MONGO_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `KAFKA_BROKERS`
- `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_EMBEDDING_MODEL`

It also hardcodes local-safe defaults for:
- JWT secret: `local-dev-secret-change-in-prod`
- integration API keys: `local-dev-key`

[`backend/src/main/resources/application-local.yml`](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-local.yml)

`application-dev.yml` expects development environment hostnames and a couple of secrets:
- `DB_PASSWORD_DEV`
- `JWT_SECRET_DEV`
- `PRODUCT_SERVICE_API_KEY_DEV`
- `ORDER_SERVICE_API_KEY_DEV`
- `PAYMENT_SERVICE_API_KEY_DEV`
- `SHIPPING_SERVICE_API_KEY_DEV`
- `CRM_SERVICE_API_KEY_DEV`

It points to dev service names like:
- `postgres-dev`
- `mongodb-dev`
- `redis-dev`
- `kafka-dev`
- `ollama-dev`

[`backend/src/main/resources/application-dev.yml`](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-dev.yml)

2. How to switch the frontend for `local` vs `dev`

The frontend currently has a development environment file that targets the local stack:
- API: `http://localhost:8080/api/v1`
- WebSocket: `ws://localhost:8080/ws`
- Auth issuer: `http://localhost:9000`

[`frontend/src/environments/environment.development.ts`](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.development.ts)

There is also a staging environment file that is meant for the `dev` backend profile on a staging cluster:
- API: `https://api.staging.aichatbot.example.com/api/v1`
- WebSocket: `wss://api.staging.aichatbot.example.com/ws`

[`frontend/src/environments/environment.staging.ts`](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.staging.ts)

What that means in practice:
- For local work, run the frontend with the development config so it talks to `localhost:8080`
- For a dev/staging deployment, swap to the staging environment file or wire the build to the dev cluster URLs
- The backend profile and frontend environment must match:
  - local frontend -> backend `local`
  - staging/dev frontend -> backend `dev`

3. How to run the whole stack end-to-end

Local stack:
```powershell
$env:SPRING_PROFILES_ACTIVE='local'
docker compose up -d
```

If you want optional extras:
```powershell
docker compose --profile debug --profile logs --profile tracing up -d
docker compose --profile ollama-init up ollama-pull
```

Then run the frontend against the local API:
```powershell
cd frontend
npm install
npm start
```

Dev/staging stack:
- Set backend profile to `dev`
- Provide the dev secrets in environment variables
- Deploy backend and supporting services to the dev environment
- Point the frontend build to the dev/staging URLs in the staging environment file

The compose file also shows the backend container wiring and default service links for the local stack:
- backend service
- postgres
- mongo
- redis
- kafka
- ollama

[`docker-compose.yml`](/C:/_Dev/chatbot/aichatbotjava/docker-compose.yml)

If you want, I can next give you a single copy-paste checklist for:
1. local developer setup
2. dev/staging deployment setup
3. the exact commands to validate health after startup