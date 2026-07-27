Linux-based runbook

1. Clone or enter the repo
```bash
cd /path/to/aichatbotjava
```

2. Start the local infrastructure
```bash
docker compose up -d
```

3. Wait for the core services to come up
```bash
docker compose ps
docker compose logs -f postgres
docker compose logs -f kafka
docker compose logs -f ollama
```

4. Start the backend in `local`
```bash
export SPRING_PROFILES_ACTIVE=local
cd backend
mvn spring-boot:run
```

5. Start the frontend in development mode
```bash
cd ../frontend
npm install
npm start
```

6. Verify backend health
```bash
curl http://localhost:8080/actuator/health
```

7. Verify the API
```bash
curl http://localhost:8080/api/v1/health
```

8. Optional extra services
```bash
docker compose --profile debug --profile logs --profile tracing up -d
docker compose --profile ollama-init up ollama-pull
```

Dev/staging Linux runbook

1. Set the backend profile and secrets
```bash
export SPRING_PROFILES_ACTIVE=dev
export DB_PASSWORD_DEV='your-dev-db-password'
export JWT_SECRET_DEV='your-dev-jwt-secret'
export PRODUCT_SERVICE_API_KEY_DEV='your-product-key'
export ORDER_SERVICE_API_KEY_DEV='your-order-key'
export PAYMENT_SERVICE_API_KEY_DEV='your-payment-key'
export SHIPPING_SERVICE_API_KEY_DEV='your-shipping-key'
export CRM_SERVICE_API_KEY_DEV='your-crm-key'
```

2. Ensure the dev services are reachable
- `postgres-dev`
- `mongodb-dev`
- `redis-dev`
- `kafka-dev`
- `ollama-dev`

3. Deploy the backend with the `dev` profile
- Build and publish the backend image or package
- Run it with `SPRING_PROFILES_ACTIVE=dev`
- Confirm Flyway is enabled in the dev profile

4. Point the frontend to the dev API
- Use the staging frontend environment file
- Replace `localhost` URLs with the dev/staging hostnames

Relevant file:
- [frontend/src/environments/environment.staging.ts](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.staging.ts)

5. Verify the deployed system
```bash
curl https://<dev-host>/actuator/health
curl https://<dev-host>/api/v1/health
```

6. What should work after deploy
- Backend health returns `UP`
- Database migrations complete successfully
- Kafka, MongoDB, Redis, and Ollama connect
- Frontend loads from the dev/staging host
- WebSocket chat connects cleanly

Relevant backend file:
- [backend/src/main/resources/application-dev.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-dev.yml)

If you want, I can also turn this into a Linux shell script with the checks in the right order.