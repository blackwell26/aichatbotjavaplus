# Implementation Task List

## AI-Powered Customer Service Chatbot for E-Commerce Platform

Derived from:

- `specs/technical_design_specifications.md`
- `specs/requitements.md`

## 1. Project Foundation

- [x] Select Maven as the standard Java build tool.
- [x] Initialize a Java 21 Spring Boot 3.x backend project.
- [x] Configure package root, `com.company.chatbot`.
- [x] Create base packages for `api`, `api.dto`, `auth`, `chat`, `intent`, `rag`, `ai`, `knowledge`, `ecommerce`, `escalation`, `recommendation`, `notification`, `analytics`, `persistence`, `messaging`, `observability`, `config`, and `common`.
- [x] Add Spring Boot starters for Web, Validation, Security, WebSocket, Actuator, Data JPA, MongoDB, Redis, and Kafka.
- [x] Add Spring AI Ollama dependency.
- [x] Decide whether LangChain4j is required for first release. Decision: Not required for first release — use Spring AI (Ollama provider) for model and RAG orchestration. LangChain4j may be introduced in later releases if advanced chain orchestration or complex tool calling is needed.
- [x] Add Resilience4j, Flyway or Liquibase, OpenTelemetry/Micrometer, and test dependencies.
- [x] Configure application profiles: `local`, `dev`, `test`, and `prod`.
- [x] Add standard build, test, lint, and package commands to project documentation.

## 2. Backend Configuration

- [x] Create `application-local.yml`.
- [x] Create `application-dev.yml`.
- [x] Create `application-test.yml`.
- [x] Create `application-prod.yml`.
- [x] Define configuration groups for `security.jwt`.
- [x] Define configuration groups for `spring.ai.ollama`.
- [x] Define configuration groups for `rag.retrieval`.
- [ ] Define configuration groups for product, order, payment, shipping, and CRM service integrations.
- [ ] Define configuration groups for PostgreSQL, MongoDB, Redis, Kafka, and RabbitMQ.
- [ ] Define configuration groups for observability and feature flags.
- [ ] Document required environment variables and secret names.

## 3. Docker Compose Infrastructure

- [ ] Create `compose.yaml` for local development.
- [ ] Add a `backend` service for the Spring Boot application.
- [ ] Add a `frontend` service placeholder or profile for the Angular UI.
- [ ] Add PostgreSQL service for operational data.
- [ ] Enable pgvector in PostgreSQL or use a pgvector-compatible image.
- [ ] Add PostgreSQL initialization scripts for database, user, extensions, and baseline schema.
- [ ] Add MongoDB service for chat sessions and conversation history.
- [ ] Add MongoDB initialization scripts for application user and database.
- [ ] Add Redis service for active sessions, cache, rate limits, and RAG context.
- [ ] Add Kafka service as the preferred event broker.
- [ ] Add Kafka UI or broker inspection service for local debugging.
- [ ] Add RabbitMQ service under an optional Compose profile for environments that require RabbitMQ.
- [ ] Add Ollama service for local LLM inference.
- [ ] Add an Ollama model pull/init helper for the selected local model.
- [ ] Add Prometheus service for metrics collection.
- [ ] Add Prometheus scrape configuration for the Spring Boot backend.
- [ ] Add Grafana service for dashboards.
- [ ] Add Grafana datasource provisioning for Prometheus.
- [ ] Add OpenSearch service for logs.
- [ ] Add OpenSearch Dashboards service for local log inspection.
- [ ] Add Jaeger service for distributed tracing.
- [ ] Add shared Docker network for all services.
- [ ] Add named volumes for PostgreSQL, MongoDB, Redis, Kafka, RabbitMQ, Ollama, Grafana, and OpenSearch.
- [ ] Add health checks for infrastructure services where supported.
- [ ] Add `.env.example` with local ports, credentials, and model settings.
- [ ] Document startup, shutdown, reset, and log inspection commands.

## 4. Domain Model

- [ ] Define customer context model.
- [ ] Define chat session model.
- [ ] Define chat message model.
- [ ] Define intent classification model.
- [ ] Define knowledge document model.
- [ ] Define knowledge chunk model.
- [ ] Define embedding reference model.
- [ ] Define support ticket model.
- [ ] Define escalation model.
- [ ] Define refund request model.
- [ ] Define recommendation model.
- [ ] Define notification event model.
- [ ] Define analytics snapshot model.
- [ ] Define audit log model.
- [ ] Define enums for user roles, intent types, chat session status, message sender type, escalation status, ticket status, confidence level, and notification status.

## 5. PostgreSQL Persistence

- [ ] Create migration for `customers`.
- [ ] Create migration for `customer_profiles`.
- [ ] Create migration for `support_tickets`.
- [ ] Create migration for `ticket_comments`.
- [ ] Create migration for `escalations`.
- [ ] Create migration for `knowledge_documents`.
- [ ] Create migration for `knowledge_chunks`.
- [ ] Create migration for `document_embeddings`.
- [ ] Create migration for `refund_requests`.
- [ ] Create migration for `analytics_snapshots`.
- [ ] Create migration for `audit_logs`.
- [ ] Add indexes for customer ID, session ID, order number, ticket status, escalation status, timestamps, and vector search.
- [ ] Implement Spring Data JPA entities and repositories.
- [ ] Add repository tests with Testcontainers PostgreSQL.

## 6. MongoDB Persistence

- [ ] Define `chat_sessions` collection document.
- [ ] Define `chat_messages` collection document.
- [ ] Define `conversation_summaries` collection document.
- [ ] Define `ai_response_metadata` collection document.
- [ ] Implement Spring Data MongoDB repositories.
- [ ] Add indexes for session ID, customer ID, status, created timestamp, and message timestamp.
- [ ] Add repository tests with Testcontainers MongoDB.

## 7. Redis Persistence and Cache

- [ ] Define key strategy for `chat:session:{sessionId}`.
- [ ] Define key strategy for `chat:context:{sessionId}`.
- [ ] Define key strategy for `rag:query-cache:{hash}`.
- [ ] Define key strategy for `auth:token-blacklist:{tokenId}`.
- [ ] Define key strategy for `rate-limit:{customerId}`.
- [ ] Implement Redis templates or repositories.
- [ ] Configure TTLs by data type.
- [ ] Add Redis integration tests.

## 8. Security and Customer Context

- [ ] Implement Spring Security `SecurityFilterChain`.
- [ ] Implement JWT authentication filter.
- [ ] Implement JWT token verifier.
- [ ] Implement customer context resolver.
- [ ] Implement role and permission evaluator.
- [ ] Enforce roles `CUSTOMER`, `AGENT`, `MANAGER`, `ADMIN`, and `SYSTEM`.
- [ ] Add endpoint authorization rules.
- [ ] Add ownership validation for customer order, payment, refund, and shipping data.
- [ ] Implement input validation for messages, file uploads, IDs, and workflow requests.
- [ ] Implement rate limiting for chat and admin upload endpoints.
- [ ] Add audit logging for sensitive actions.
- [ ] Add security tests for JWT, RBAC, and ownership checks.

## 9. Chat Session Service

- [ ] Implement chat session create workflow.
- [ ] Implement chat session resume workflow.
- [ ] Implement chat session close workflow.
- [ ] Implement customer message submission workflow.
- [ ] Persist full conversation transcript to MongoDB.
- [ ] Store active session state in Redis.
- [ ] Track sender role, message timestamp, response latency, AI confidence, and escalation status.
- [ ] Add service tests for create, resume, close, message append, and history retrieval.

## 10. REST Chat APIs

- [ ] Implement `POST /api/v1/chat/sessions`.
- [ ] Implement `GET /api/v1/chat/sessions/{sessionId}`.
- [ ] Implement `POST /api/v1/chat/sessions/{sessionId}/messages`.
- [ ] Implement `POST /api/v1/chat/sessions/{sessionId}/close`.
- [ ] Implement `GET /api/v1/chat/sessions/{sessionId}/history`.
- [ ] Add DTOs and validation for chat requests and responses.
- [ ] Add controller tests for authenticated and unauthorized access.

## 11. WebSocket Chat APIs

- [ ] Configure Spring WebSocket with STOMP endpoint `/ws/chat`.
- [ ] Implement `/app/chat.send` handler.
- [ ] Implement `/topic/chat.sessions.{sessionId}` subscription publishing.
- [ ] Implement `/user/queue/chat` private response publishing.
- [ ] Propagate authentication and customer context into WebSocket sessions.
- [ ] Stream AI-generated responses where supported.
- [ ] Add WebSocket integration tests.

## 12. Intent Recognition

- [ ] Implement deterministic rules for order numbers and escalation phrases.
- [ ] Implement supported intent enum: product inquiry, order status, refund request, shipping inquiry, payment issue, account issue, FAQ, escalation request, and unknown.
- [ ] Implement Ollama-based classification for ambiguous messages.
- [ ] Implement hybrid classification result with confidence score and fallback reason.
- [ ] Add tests for each supported intent and low-confidence fallback.

## 13. Knowledge Base and Ingestion

- [ ] Implement admin upload endpoint for FAQ, policy, manual, and support article documents.
- [ ] Validate file type, size, content type, and permissions.
- [ ] Extract text from uploaded documents.
- [ ] Chunk documents into retrieval-friendly segments.
- [ ] Generate embeddings for each chunk.
- [ ] Persist document metadata and chunks in PostgreSQL.
- [ ] Persist embeddings in pgvector or the selected vector database.
- [ ] Support document replacement and versioning.
- [ ] Track ingestion job status.
- [ ] Add ingestion tests for valid documents, rejected documents, replacement, and failure handling.

## 14. RAG Orchestration

- [ ] Implement embedding query generation for customer questions.
- [ ] Implement vector similarity search.
- [ ] Implement chunk ranking and filtering.
- [ ] Build prompt context from customer context, intent, retrieved chunks, external service facts, and safety constraints.
- [ ] Include source citations or source references.
- [ ] Bound prompt size using configured token or character limits.
- [ ] Cache safe retrieval results in Redis.
- [ ] Add tests for retrieval relevance, ranking, prompt assembly, and no-result fallback.

## 15. Ollama AI Integration

- [ ] Configure Spring AI Ollama chat client.
- [ ] Configure Spring AI Ollama embedding client.
- [ ] Support configured models: Llama 3, Mistral, Qwen, and Gemma as environment-specific options.
- [ ] Implement request timeout, retry, and circuit breaker policies.
- [ ] Capture prompt size, completion latency, model name, failure reason, and confidence metadata.
- [ ] Implement fallback response when Ollama is unavailable.
- [ ] Add integration tests with a stubbed Ollama client or local Testcontainers-compatible strategy.

## 16. AI Safety and Redaction

- [ ] Define approved system prompt template.
- [ ] Add prompt injection mitigation for user messages and retrieved knowledge.
- [ ] Mask customer data before AI prompt generation.
- [ ] Prevent exposure of internal prompts, credentials, hidden policies, or unrelated customer data.
- [ ] Require structured AI response metadata with response text, intent, confidence, citations, and escalation recommendation.
- [ ] Add tests for redaction, prompt safety rules, and structured output parsing.

## 17. E-Commerce Integration Clients

- [ ] Implement `ProductClient` for product details, search, pricing, specifications, and inventory checks.
- [ ] Implement `OrderClient` for order status, order history, and ownership validation.
- [ ] Implement `PaymentClient` for payment verification, payment issue lookup, and refund status.
- [ ] Implement `ShippingClient` for tracking number, carrier status, and estimated delivery date.
- [ ] Implement `CrmClient` for customer profile, preferences, and support history.
- [ ] Configure `RestClient` or `WebClient` for each downstream service.
- [ ] Add timeouts, retries, circuit breakers, and correlation ID propagation.
- [ ] Add contract tests or mock-server tests for all external clients.

## 18. Product and Order APIs

- [ ] Implement `GET /api/v1/products/search`.
- [ ] Implement `GET /api/v1/products/{productId}`.
- [ ] Implement `GET /api/v1/orders`.
- [ ] Implement `GET /api/v1/orders/{orderNumber}`.
- [ ] Implement `GET /api/v1/orders/{orderNumber}/tracking`.
- [ ] Enforce customer ownership on order endpoints.
- [ ] Add controller tests for success, not found, unauthorized, and forbidden cases.

## 19. Refund and Return Workflow

- [ ] Implement return eligibility rules.
- [ ] Implement refund request creation.
- [ ] Validate customer ownership of order.
- [ ] Retrieve return policy through RAG when explaining policy to customers.
- [ ] Integrate with Payment Service for permitted refund workflow initiation.
- [ ] Escalate policy exceptions or high-risk refund requests.
- [ ] Implement `POST /api/v1/orders/{orderNumber}/return-eligibility`.
- [ ] Implement `POST /api/v1/orders/{orderNumber}/refund-requests`.
- [ ] Implement `GET /api/v1/refund-requests/{requestId}`.
- [ ] Add workflow and API tests.

## 20. Human Escalation and Ticketing

- [ ] Implement escalation triggers for customer request.
- [ ] Implement escalation trigger for low AI confidence.
- [ ] Implement escalation trigger for sensitive issues.
- [ ] Create escalation records in PostgreSQL.
- [ ] Package conversation summary, transcript reference, customer context, and AI confidence.
- [ ] Integrate with human support ticket system.
- [ ] Implement `POST /api/v1/chat/sessions/{sessionId}/escalate`.
- [ ] Implement `GET /api/v1/agent/escalations`.
- [ ] Implement `GET /api/v1/agent/escalations/{escalationId}`.
- [ ] Implement `PUT /api/v1/agent/escalations/{escalationId}/assign`.
- [ ] Implement `PUT /api/v1/agent/escalations/{escalationId}/status`.
- [ ] Add escalation workflow tests.

## 21. Recommendation Service

- [ ] Retrieve customer purchase history.
- [ ] Retrieve product catalog candidates.
- [ ] Apply business rules to filter unavailable or restricted products.
- [ ] Generate explainable recommendation reasons.
- [ ] Integrate recommendations into chat workflow.
- [ ] Add tests for recommendation filtering and explanation output.

## 22. Notification Service

- [ ] Define notification event payloads.
- [ ] Generate notifications for order shipped.
- [ ] Generate notifications for refund approved.
- [ ] Generate notifications for ticket assigned.
- [ ] Generate notifications for escalation updates.
- [ ] Publish notification events to Kafka.
- [ ] Add RabbitMQ adapter if required by deployment target.
- [ ] Integrate with email, SMS, push, or internal notification service.
- [ ] Add tests for event publication and adapter behavior.

## 23. Messaging and Event Processing

- [ ] Define event envelope with event ID, event type, timestamp, correlation ID, causation ID, tenant or organization ID, payload version, and payload.
- [ ] Create Kafka topics for chat message received, response generated, session closed, escalation requested, support ticket created, order status updated, refund request created, refund request updated, notification requested, knowledge document ingested, and analytics metric recorded.
- [ ] Implement producers for chat, escalation, support, refund, notification, knowledge, and analytics events.
- [ ] Implement consumers required by notification and analytics workflows.
- [ ] Configure dead-letter topics for failed event processing.
- [ ] Add event serialization and compatibility tests.

## 24. Analytics Service

- [ ] Track chat volume.
- [ ] Track response time.
- [ ] Track escalation rate.
- [ ] Track customer satisfaction.
- [ ] Track model latency and fallback rates.
- [ ] Persist analytics snapshots where required.
- [ ] Export operational metrics to Prometheus.
- [ ] Implement manager analytics APIs for chat volume, response time, escalation rate, and customer satisfaction.
- [ ] Add tests for aggregation and API results.

## 25. Observability

- [ ] Add Spring Boot Actuator endpoints.
- [ ] Configure Micrometer Prometheus metrics export.
- [ ] Add structured JSON logging with correlation ID, request ID, and safe session ID.
- [ ] Configure OpenTelemetry tracing.
- [ ] Export traces to Jaeger.
- [ ] Forward logs to OpenSearch.
- [ ] Add metrics for request latency, chat latency, RAG retrieval latency, Ollama latency, escalation rate, AI confidence, error rate, and circuit breaker state.
- [ ] Create baseline Grafana dashboards for application, AI, RAG, and infrastructure metrics.

## 26. Reliability and Resilience

- [ ] Configure Resilience4j timeouts for downstream service calls.
- [ ] Configure retry with backoff for transient failures.
- [ ] Configure circuit breakers for e-commerce services.
- [ ] Configure circuit breakers for Ollama.
- [ ] Configure bulkheads for AI generation.
- [ ] Implement fallback responses when AI is unavailable.
- [ ] Implement fallback responses when vector search is unavailable.
- [ ] Configure dead-letter handling for failed events.
- [ ] Add resilience tests for timeout, retry, circuit breaker, and fallback behavior.

## 27. Performance

- [ ] Validate simple FAQ response time under 2 seconds.
- [ ] Validate order inquiry response time under 3 seconds.
- [ ] Validate AI-generated response time under 5 seconds.
- [ ] Implement WebSocket streaming for generated responses.
- [ ] Cache frequent safe FAQ and RAG retrieval results.
- [ ] Precompute embeddings during ingestion.
- [ ] Configure prompt size limits.
- [ ] Add load tests for concurrency assumptions.

## 28. Admin and Manager APIs

- [ ] Implement account context APIs.
- [ ] Implement admin knowledge document list and detail APIs.
- [ ] Implement manager analytics APIs.
- [ ] Protect admin APIs with `ADMIN` role.
- [ ] Protect manager APIs with `MANAGER` role.
- [ ] Add controller tests for role enforcement.

## 29. Deployment Assets

- [ ] Create backend Dockerfile with multi-stage Java build.
- [ ] Create frontend Dockerfile if frontend source is part of this repository.
- [ ] Wire backend container to Compose infrastructure services.
- [ ] Create Kubernetes manifests or Helm chart for backend.
- [ ] Create Kubernetes manifests or Helm chart for frontend.
- [ ] Create Kubernetes manifests or Helm chart for worker processes if separated.
- [ ] Configure readiness and liveness probes.
- [ ] Configure resource requests and limits.
- [ ] Configure secrets through Kubernetes secrets, sealed secrets, or external secret manager.
- [ ] Document OpenShift deployment differences.

## 30. Testing and Validation

- [ ] Add JUnit 5 unit tests for domain logic.
- [ ] Add Mockito tests for service layer dependencies.
- [ ] Add Spring Boot controller tests for REST endpoints.
- [ ] Add WebSocket integration tests.
- [ ] Add Testcontainers tests for PostgreSQL, MongoDB, Redis, Kafka, and RabbitMQ if enabled.
- [ ] Add integration tests for Ollama adapter using stub or local runtime.
- [ ] Add contract tests for e-commerce clients.
- [ ] Add security tests for JWT, RBAC, ownership validation, and input validation.
- [ ] Add end-to-end tests for FAQ, order tracking, refund request, and escalation workflows.
- [ ] Add OWASP ZAP baseline security scan.
- [ ] Add Gatling or k6 performance tests.

## 31. Acceptance Criteria Traceability

- [ ] Customers can interact with chatbot through REST and WebSocket chat APIs.
- [ ] FAQ answers reach at least 90% accuracy through RAG evaluation.
- [ ] Order tracking requests are processed through Order and Shipping clients.
- [ ] Human escalation creates agent-visible escalation and ticket records.
- [ ] RAG retrieves relevant documents through vector search.
- [ ] Ollama models generate valid responses with structured metadata.
- [ ] Performance and security requirements pass validation.
- [ ] Monitoring and logging are operational through Prometheus, Grafana, OpenSearch, and Jaeger.
- [ ] Deployment succeeds in Docker Compose and Kubernetes/OpenShift.
- [ ] End-to-end customer service workflows are validated.

## 32. Implementation Milestones

### Milestone 1: Foundation and Local Infrastructure

- [ ] Spring Boot backend scaffold, profiles, Docker Compose infrastructure, and database connectivity are complete.

### Milestone 2: Security and Chat Core

- [ ] JWT security, customer context, chat sessions, REST chat APIs, and WebSocket chat APIs are complete.

### Milestone 3: Knowledge Base and AI

- [ ] Knowledge ingestion, embeddings, vector search, RAG orchestration, Ollama integration, and AI safety controls are complete.

### Milestone 4: E-Commerce Workflows

- [ ] Product, order, shipping, payment, refund, recommendation, and notification workflows are complete.

### Milestone 5: Human Support and Analytics

- [ ] Escalation, ticketing, agent APIs, manager analytics, audit logging, and dashboard metrics are complete.

### Milestone 6: Production Readiness

- [ ] Resilience, observability, security validation, performance validation, Kubernetes/OpenShift deployment, and acceptance testing are complete.

## 33. Open Implementation Decisions

- [ ] Finalize Maven or Gradle.
- [ ] Finalize whether Spring AI alone is sufficient or LangChain4j is required.
- [ ] Finalize pgvector versus dedicated vector database for first release.
- [ ] Finalize Kafka-only versus Kafka plus RabbitMQ support.
- [ ] Finalize JWT issuer and identity provider.
- [ ] Finalize support ticket system API and schema.
- [ ] Finalize e-commerce service API contracts.
- [ ] Finalize production Ollama model and GPU sizing.
