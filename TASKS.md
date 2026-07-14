Task #10
Files created/modified:

  api/dto/ — New DTOs:

  - ChatSessionDto — expanded with updatedAt, closedAt, channel, escalationId, metadata
  - ChatMessageDto — full message representation for history/send responses
  - SendMessageRequest — request body with @NotBlank / @Size validation
  - SendMessageResponse — wraps customer message, updated session, and aiResponse (null until Task #15)
  - CloseSessionResponse — wraps closed session and a confirmation message
  - ChatHistoryResponse — ordered messages + totalMessages count
  - ChatDtoMapper — stateless converter from domain objects to DTOs

  api/ChatSessionController.java — Full 5-endpoint implementation:

  - POST /sessions → 201, validates metadata, writes audit log
  - GET /sessions/{id} → 200/404, validates session ID format
  - POST /sessions/{id}/messages → 200/400/404, dual validation (JSR-303 + ChatMessageValidator)
  - POST /sessions/{id}/close → 200/404, idempotent, writes audit log
  - GET /sessions/{id}/history → 200, transcript with message count

  api/ApiExceptionHandler.java — Added ChatSessionNotFoundException → 404 and MethodArgumentNotValidException → 400 with per-field
  detail

  test/.../api/ChatSessionControllerTest.java — 24 tests across 5 @Nested classes, full Spring Security stack active, all pass.

Task #12: Intent Recognition — Complete

  New files created

  intent/IntentClassificationProperties.java

  Config class (@ConfigurationProperties("intent.classification")) — controls enabled flag, Ollama model name, rule
  confidence score (default 0.95), minimum confidence threshold (default 0.5), and max message length.

  intent/DeterministicIntentClassifier.java

  Prioritised rule engine using compiled regex and keyword lists:

  - Escalation phrases → ESCALATION_REQUEST (highest priority)
  - Order number pattern (ORD-12345, #98765432, bare 8-12 digit numbers) → ORDER_STATUS
  - Refund / return / cancel keywords → REFUND_REQUEST
  - Shipping / delivery / tracking keywords → SHIPPING_INQUIRY
  - Payment / billing / charge keywords → PAYMENT_ISSUE
  - Account / login / password keywords → ACCOUNT_ISSUE
  - Product / price / stock keywords → PRODUCT_INQUIRY

  intent/OllamaIntentClassifier.java

  Spring AI ChatClient-based classifier. Sends a structured system prompt instructing the model to respond with
  {"intent":"<TYPE>","confidence":0.0-1.0}. Handles markdown fences, confidence clamping, unknown labels, and all
  network/parse errors by returning Optional.empty().

  intent/IntentClassificationService.java

  Hybrid orchestrator:

  1. Deterministic rules (fast path — short-circuits when a rule fires)
  2. Ollama LLM (only when no rule matches)
  3. Low-confidence fallback → UNKNOWN with a descriptive fallbackReason
  4. All exceptions in both classifiers are caught — classify() never throws

  chat/ChatSessionService.java (modified)
  Wires IntentClassificationService as optional @Autowired(required=false). The appendMessage workflow now
  auto-classifies CUSTOMER messages when the caller doesn't supply an explicit intentType.

  test/.../intent/IntentClassificationServiceTest.java

  77 tests across 4 nested test classes covering every intent type, escalation priority, Ollama JSON parsing (including
  markdown fences and confidence clamping), low-confidence fallback, disabled feature flag, Ollama unavailable, and
  exception-safety guarantees.

