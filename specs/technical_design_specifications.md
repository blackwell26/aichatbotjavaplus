# Technical Design Specifications

## AI-Powered Customer Service Chatbot for E-Commerce Platform

Version: 1.0

Derived from: `specs/requitements.md`

## 1. Purpose

This document defines the technical design for a Java and Spring-based AI customer service chatbot for an e-commerce platform. It translates the requirements specification into concrete backend architecture, service boundaries, APIs, data storage, AI/RAG processing, integration patterns, security controls, observability, and deployment design.

The backend implementation is based on Java, Spring Boot, Spring Security, Spring WebSocket, Spring Data, Spring AI, and optional LangChain4j integration. Local AI inference is provided through Ollama to keep customer data inside the organization's infrastructure.

## 2. Scope

The system will provide:

- Authenticated customer chat support.
- Chat session lifecycle and conversation history.
- Intent recognition for product, order, refund, shipping, payment, account, FAQ, and escalation requests.
- Product, order, payment, shipping, and CRM integration.
- Knowledge base search and Retrieval-Augmented Generation.
- Ollama-backed AI response generation.
- Human escalation and support ticket handoff.
- Customer recommendations and notifications.
- Operational analytics and observability.
- Containerized deployment for Docker Compose, Kubernetes, and OpenShift.

## 3. Technology Stack

| Layer | Technology |
| --- | --- |
| Language | Java 21 |
| Backend Framework | Spring Boot 3.x |
| API | Spring Web MVC |
| Realtime Chat | Spring WebSocket with STOMP |
| Security | Spring Security, JWT, RBAC |
| AI Integration | Spring AI Ollama, optional LangChain4j adapters |
| Persistence | PostgreSQL, MongoDB, Redis |
| Vector Search | PostgreSQL pgvector or dedicated vector database |
| Messaging | Kafka as preferred event broker, RabbitMQ as optional adapter |
| Observability | Micrometer, Prometheus, Grafana, OpenSearch, Jaeger/OpenTelemetry |
| Build Tool | Maven or Gradle |
| Deployment | Docker, Kubernetes, Red Hat OpenShift |

## 4. System Architecture

```text
Angular Customer UI / Agent Console
    -> REST APIs
    -> WebSocket/STOMP Chat Channel

Spring Boot Chatbot Backend
    -> Authentication and Authorization
    -> Chat Session Service
    -> Intent Recognition Service
    -> RAG Orchestration Service
    -> Ollama AI Client
    -> Product/Order/Payment/Shipping Clients
    -> Knowledge Base Service
    -> Escalation and Ticket Service
    -> Recommendation Service
    -> Notification Service
    -> Analytics Service

Data and Infrastructure
    -> PostgreSQL operational data
    -> MongoDB conversation history
    -> Redis session/cache/RAG context
    -> pgvector/vector database embeddings
    -> Kafka/RabbitMQ events
    -> Ollama local LLM runtime
    -> Prometheus/Grafana/OpenSearch/Jaeger
```

## 5. Backend Module Design

The backend should be structured by business capability.

```text
com.company.chatbot
    api
    api.dto
    auth
    chat
    intent
    rag
    ai
    knowledge
    ecommerce.product
    ecommerce.order
    ecommerce.payment
    ecommerce.shipping
    escalation
    recommendation
    notification
    analytics
    persistence.postgres
    persistence.mongo
    persistence.redis
    messaging
    observability
    config
    common
```

## 6. Core Components

### 6.1 Authentication and Customer Context

Responsibilities:

- Validate JWT tokens from the customer portal or agent console.
- Resolve authenticated customer identity, roles, permissions, and session context.
- Apply RBAC for customer, support agent, support manager, and system administrator roles.
- Mask sensitive customer data before AI prompt construction.

Primary Spring components:

- `SecurityFilterChain`
- `JwtAuthenticationFilter`
- `JwtTokenVerifier`
- `CustomerContextResolver`
- `RolePermissionEvaluator`

### 6.2 Chat Session Service

Responsibilities:

- Create, resume, and close chat sessions.
- Accept customer messages through REST or WebSocket.
- Persist conversation history.
- Track sender role, message timestamp, response latency, confidence, and escalation status.

Storage:

- MongoDB for full conversation transcript.
- Redis for active session state and short-lived context.
- PostgreSQL for customer-facing support and escalation records.

### 6.3 Intent Recognition Service

Responsibilities:

- Classify incoming messages into supported intents.
- Select the right workflow for product, order, refund, shipping, payment, account, FAQ, or escalation.
- Attach confidence score and fallback reason.

Implementation options:

- Deterministic rules for high-confidence patterns such as order numbers and escalation phrases.
- LLM classification through Ollama for ambiguous requests.
- Hybrid classifier combining rules, embeddings, and model output.

Supported intents:

```text
PRODUCT_INQUIRY
ORDER_STATUS
REFUND_REQUEST
SHIPPING_INQUIRY
PAYMENT_ISSUE
ACCOUNT_ISSUE
FAQ
ESCALATION_REQUEST
UNKNOWN
```

### 6.4 RAG Orchestration Service

Responsibilities:

- Convert customer question into embedding query.
- Search vector database for relevant FAQ, policy, manual, and support article chunks.
- Rank and filter retrieved chunks.
- Build AI prompt with customer context, intent, relevant documents, guardrails, and response format.
- Include citations or source references where available.

Workflow:

```text
Customer message
    -> intent classification
    -> embedding generation
    -> vector search
    -> context assembly
    -> Ollama response generation
    -> post-processing
    -> response delivery
```

### 6.5 Ollama AI Client

Responsibilities:

- Integrate with local Ollama runtime.
- Support configured models such as Llama 3, Mistral, Qwen, and Gemma.
- Enforce request timeout, retry, and circuit breaker policies.
- Capture prompt size, completion latency, model name, and failure reason.

Preferred implementation:

- Spring AI Ollama chat and embedding clients.
- Optional LangChain4j adapter if advanced chain orchestration is required.

### 6.6 Knowledge Base Service

Responsibilities:

- Ingest FAQ documents, policies, manuals, and support articles.
- Chunk documents into retrieval-friendly segments.
- Generate embeddings for chunks.
- Store document metadata, chunks, versions, and embedding references.
- Support replacement and versioning of knowledge articles.

Storage:

- PostgreSQL for document metadata.
- pgvector or vector database for embeddings.
- Object storage or filesystem-backed storage for original uploaded documents if needed.

### 6.7 E-Commerce Integration Clients

The backend integrates with existing e-commerce microservices through typed client interfaces.

| Client | Responsibilities |
| --- | --- |
| ProductClient | Product details, search, pricing, specifications, inventory checks. |
| OrderClient | Order status, order history, order ownership validation. |
| PaymentClient | Payment verification, payment issue lookup, refund status. |
| ShippingClient | Tracking number, carrier status, estimated delivery date. |
| CrmClient | Customer profile, preferences, support history. |

Implementation:

- Spring `RestClient` or `WebClient`.
- Resilience4j retry, timeout, and circuit breaker.
- Correlation IDs propagated across downstream calls.

### 6.8 Refund and Return Workflow

Responsibilities:

- Validate customer ownership of the order.
- Check return eligibility rules.
- Explain return and refund policy using knowledge base retrieval.
- Initiate refund workflow through Payment Service when permitted.
- Escalate to a human agent when policy or risk rules require manual review.

### 6.9 Human Escalation and Ticket Service

Responsibilities:

- Create escalation records when requested by customer, low confidence, or sensitive issue.
- Package conversation summary, transcript references, customer context, and AI confidence.
- Create or update support tickets in the human support system.
- Notify support agents and expose escalated sessions to the Agent Console.

### 6.10 Recommendation Service

Responsibilities:

- Recommend products using customer purchase history, product catalog, and business rules.
- Avoid recommendations for unavailable or restricted products.
- Provide explainable recommendation reasons where possible.

### 6.11 Notification Service

Responsibilities:

- Generate notifications for order shipped, refund approved, ticket assigned, and escalation updates.
- Publish notification events to Kafka or RabbitMQ.
- Integrate with email, SMS, push, or internal notification services as available.

### 6.12 Analytics Service

Responsibilities:

- Track chat volume, response time, escalation rate, customer satisfaction, model latency, and fallback rates.
- Provide aggregated data for manager dashboards.
- Export metrics to Prometheus and optionally persist analytics snapshots.

## 7. API Design

All REST APIs should be versioned under `/api/v1`.

### 7.1 Authentication and Account APIs

```text
GET /api/v1/account/me
GET /api/v1/account/context
```

### 7.2 Chat APIs

```text
POST /api/v1/chat/sessions
GET  /api/v1/chat/sessions/{sessionId}
POST /api/v1/chat/sessions/{sessionId}/messages
POST /api/v1/chat/sessions/{sessionId}/close
GET  /api/v1/chat/sessions/{sessionId}/history
```

### 7.3 WebSocket APIs

```text
CONNECT /ws/chat
SEND      /app/chat.send
SUBSCRIBE /topic/chat.sessions.{sessionId}
SUBSCRIBE /user/queue/chat
```

### 7.4 Product and Order APIs

```text
GET /api/v1/products/search
GET /api/v1/products/{productId}
GET /api/v1/orders
GET /api/v1/orders/{orderNumber}
GET /api/v1/orders/{orderNumber}/tracking
```

### 7.5 Refund and Return APIs

```text
POST /api/v1/orders/{orderNumber}/return-eligibility
POST /api/v1/orders/{orderNumber}/refund-requests
GET  /api/v1/refund-requests/{requestId}
```

### 7.6 Knowledge Base APIs

```text
POST /api/v1/admin/knowledge/documents
GET  /api/v1/admin/knowledge/documents
GET  /api/v1/admin/knowledge/documents/{documentId}
POST /api/v1/admin/knowledge/documents/{documentId}/replace
GET  /api/v1/admin/knowledge/ingestion/{jobId}
```

### 7.7 Escalation and Ticket APIs

```text
POST /api/v1/chat/sessions/{sessionId}/escalate
GET  /api/v1/agent/escalations
GET  /api/v1/agent/escalations/{escalationId}
PUT  /api/v1/agent/escalations/{escalationId}/assign
PUT  /api/v1/agent/escalations/{escalationId}/status
```

### 7.8 Analytics APIs

```text
GET /api/v1/manager/analytics/chat-volume
GET /api/v1/manager/analytics/response-time
GET /api/v1/manager/analytics/escalation-rate
GET /api/v1/manager/analytics/customer-satisfaction
```

## 8. Data Design

### 8.1 PostgreSQL Operational Tables

```text
customers
customer_profiles
support_tickets
ticket_comments
escalations
knowledge_documents
knowledge_chunks
document_embeddings
refund_requests
analytics_snapshots
audit_logs
```

PostgreSQL should be used for transactional support, customer-related references, knowledge metadata, ticket handoff records, refund workflow state, and auditability.

### 8.2 MongoDB Collections

```text
chat_sessions
chat_messages
conversation_summaries
ai_response_metadata
```

MongoDB should hold flexible conversation transcripts and AI metadata, including prompt references, response confidence, and source citations.

### 8.3 Redis Keys

```text
chat:session:{sessionId}
chat:context:{sessionId}
rag:query-cache:{hash}
auth:token-blacklist:{tokenId}
rate-limit:{customerId}
```

Redis should be used for active session state, short-lived RAG context, rate limiting, and security token state.

### 8.4 Vector Data

Vector records should include:

```text
embedding_id
document_id
chunk_id
embedding_vector
source_title
source_type
version
created_at
```

The first implementation may use PostgreSQL pgvector to reduce operational complexity. A dedicated vector database can be introduced later if retrieval scale requires it.

## 9. Event Design

Kafka is the preferred event broker. RabbitMQ can be supported through an adapter if the target environment requires it.

Recommended topics:

```text
chat.message.received
chat.response.generated
chat.session.closed
chat.escalation.requested
support.ticket.created
order.status.updated
refund.request.created
refund.request.updated
notification.requested
knowledge.document.ingested
analytics.chat.metric-recorded
```

Each event should include:

```text
eventId
eventType
timestamp
correlationId
causationId
tenantId or organizationId
payloadVersion
payload
```

## 10. Security Design

Security controls:

- JWT authentication for customer, agent, manager, and administrator access.
- RBAC enforced at controller and service layers.
- TLS for all external and internal service calls.
- Input validation for messages, file uploads, IDs, and workflow requests.
- Prompt injection mitigation for RAG context and user messages.
- Data masking before AI prompt generation.
- Audit logging for login-sensitive actions, refund workflows, escalation actions, and admin knowledge changes.
- Rate limiting for chat and knowledge upload endpoints.
- Ownership validation before exposing order, payment, refund, or shipping information.

Roles:

```text
CUSTOMER
AGENT
MANAGER
ADMIN
SYSTEM
```

## 11. AI Safety and Prompt Design

The AI layer must:

- Use only the provided customer context, retrieved documents, and approved system instructions.
- Avoid exposing internal prompts, credentials, hidden policies, or unrelated customer data.
- Ask clarifying questions when confidence is low.
- Escalate sensitive issues or high-risk workflows.
- Return structured metadata with response text, intent, confidence, citations, and escalation recommendation.

Prompt inputs:

```text
System instruction
Customer role and allowed context
Conversation summary
Latest customer message
Detected intent
Retrieved knowledge chunks
External service facts
Safety and privacy constraints
Required response format
```

## 12. Reliability and Resilience

Required patterns:

- Timeouts for all external API calls.
- Retry with backoff for transient failures.
- Circuit breakers around e-commerce services and Ollama.
- Bulkheads for AI generation to avoid starving transactional requests.
- Fallback responses when AI or vector search is unavailable.
- Graceful degradation for non-critical recommendation and analytics functions.
- Dead-letter topics for failed event processing.

Spring implementation:

- Resilience4j annotations or decorators.
- Spring Retry where appropriate.
- Micrometer timers and counters for failure tracking.

## 13. Performance Design

Targets:

| Workflow | Requirement | Design Approach |
| --- | --- | --- |
| Simple FAQ | Less than 2 seconds | Cache frequent answers and keep vector retrieval bounded. |
| Order inquiry | Less than 3 seconds | Call order/shipping APIs directly before AI summarization. |
| AI generated response | Less than 5 seconds | Limit prompt size, tune Ollama model, stream responses where possible. |
| Concurrent users | 10,000 | Horizontal scaling, stateless API nodes, Redis session state, async workers. |

Performance controls:

- Use WebSocket streaming for generated responses.
- Cache knowledge retrieval results where safe.
- Precompute embeddings during ingestion.
- Keep LLM prompts within configured token budgets.
- Use asynchronous event processing for analytics and notifications.

## 14. Observability Design

The backend should emit:

- Structured JSON logs with correlation ID, customer-safe session ID, and request ID.
- Metrics for request latency, chat latency, RAG retrieval latency, Ollama latency, escalation rate, AI confidence, error rate, and circuit breaker state.
- Distributed traces across API, RAG, Ollama, and downstream e-commerce service calls.
- Audit events for security and workflow-sensitive operations.

Tooling:

```text
Micrometer
Prometheus
Grafana
OpenTelemetry
Jaeger
OpenSearch
```

## 15. Deployment Design

### 15.1 Development

Docker Compose should run:

```text
Spring Boot backend
Angular frontend
PostgreSQL
MongoDB
Redis
Kafka or RabbitMQ
Ollama
Prometheus
Grafana
```

### 15.2 Test

Kubernetes test deployment should include:

- Backend and frontend deployments.
- Test database instances.
- Mock or test e-commerce services.
- Test Ollama runtime or model stub.
- Integration test jobs.

### 15.3 Production

Production should run on Red Hat OpenShift or Kubernetes.

Minimum production design:

- At least 3 worker nodes.
- Horizontally scalable Spring Boot backend pods.
- PostgreSQL HA cluster.
- MongoDB replica set or managed equivalent.
- Redis HA or managed equivalent.
- Kafka cluster.
- Ollama GPU nodes.
- Monitoring stack.
- Kubernetes secrets and sealed secrets or external secret manager.

## 16. Configuration Design

Configuration should be externalized through Spring profiles:

```text
application-local.yml
application-dev.yml
application-test.yml
application-prod.yml
```

Configuration groups:

```text
security.jwt
spring.ai.ollama
rag.retrieval
integrations.product-service
integrations.order-service
integrations.payment-service
integrations.shipping-service
messaging.kafka
storage.postgres
storage.mongodb
storage.redis
observability
feature-flags
```

Secrets must not be committed to source control.

## 17. Testing Strategy

Required test layers:

- Unit tests for intent recognition, prompt building, RAG ranking, redaction, and workflow decisions.
- Controller tests for REST and WebSocket endpoints.
- Integration tests for PostgreSQL, MongoDB, Redis, Kafka, and Ollama adapters.
- Contract tests for e-commerce service clients.
- Security tests for JWT, RBAC, ownership validation, and input validation.
- End-to-end tests for FAQ, order tracking, refund request, and escalation workflows.
- Performance tests for target response times and concurrent user assumptions.

Recommended tools:

```text
JUnit 5
Mockito
Spring Boot Test
Testcontainers
REST Assured
OWASP ZAP baseline scan
Gatling or k6
```

## 18. Acceptance Criteria Traceability

| Requirement Acceptance Criteria | Technical Design Coverage |
| --- | --- |
| Customers can interact with chatbot | Chat APIs, WebSocket APIs, Chat Session Service |
| FAQ accuracy at least 90% | Knowledge Base Service, RAG Orchestration, AI evaluation tests |
| Order tracking works | OrderClient, Product and Order APIs, ownership validation |
| Human escalation works | Escalation and Ticket Service, Agent APIs |
| RAG retrieves relevant documents | Vector data, Knowledge Base Service, RAG Orchestration |
| Ollama models generate valid responses | Ollama AI Client, AI safety and output metadata |
| Performance and security requirements met | Performance Design, Security Design, Reliability Design |
| Monitoring and logging operational | Observability Design |
| Kubernetes/OpenShift deployment succeeds | Deployment Design and Configuration Design |
| End-to-end workflows validated | Testing Strategy |

## 19. Open Technical Decisions

The following items should be finalized before implementation:

1. Maven or Gradle as the standard build tool.
2. Whether Spring AI alone is sufficient or LangChain4j is needed for chain orchestration.
3. Whether pgvector is the initial vector store or a dedicated vector database is required.
4. Kafka or RabbitMQ as the first supported production broker.
5. Exact JWT issuer and identity provider.
6. Source of customer satisfaction metrics.
7. Support ticket system API and ticket schema.
8. Product, order, payment, and shipping API contracts.
9. Required Ollama model for production and GPU sizing.
