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

