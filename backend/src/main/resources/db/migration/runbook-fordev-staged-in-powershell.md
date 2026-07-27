Dev/staging runbook

1. Set the backend profile and secrets
```powershell
$env:SPRING_PROFILES_ACTIVE='dev'
$env:DB_PASSWORD_DEV='your-dev-db-password'
$env:JWT_SECRET_DEV='your-dev-jwt-secret'
$env:PRODUCT_SERVICE_API_KEY_DEV='your-product-key'
$env:ORDER_SERVICE_API_KEY_DEV='your-order-key'
$env:PAYMENT_SERVICE_API_KEY_DEV='your-payment-key'
$env:SHIPPING_SERVICE_API_KEY_DEV='your-shipping-key'
$env:CRM_SERVICE_API_KEY_DEV='your-crm-key'
```

2. Make sure the dev services exist and are reachable
- `postgres-dev`
- `mongodb-dev`
- `redis-dev`
- `kafka-dev`
- `ollama-dev`

3. Deploy the backend with the `dev` profile
- Build the backend image or package it in your pipeline
- Run it with `SPRING_PROFILES_ACTIVE=dev`
- Confirm Flyway is enabled in the dev profile

4. Point the frontend at the dev API
- Use the staging frontend environment file
- Set API and WebSocket URLs to the dev/staging hostnames, not `localhost`

Relevant frontend file:
- [frontend/src/environments/environment.staging.ts](/C:/_Dev/chatbot/aichatbotjava/frontend/src/environments/environment.staging.ts)

5. Verify the deployed system
```powershell
curl https://<dev-host>/actuator/health
curl https://<dev-host>/api/v1/health
```

6. What should work after deploy
- Backend health returns `UP`
- Database migrations complete successfully
- Kafka, MongoDB, Redis, and Ollama connect
- Frontend loads from the dev/staging host
- WebSocket chat connects cleanly

Backend profile reference:
- [backend/src/main/resources/application-dev.yml](/C:/_Dev/chatbot/aichatbotjava/backend/src/main/resources/application-dev.yml)

If you want, I can turn this into a single copy-paste `.ps1` script that sets the vars and starts the dev checks in order.