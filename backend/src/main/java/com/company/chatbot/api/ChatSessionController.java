package com.company.chatbot.api;

import com.company.chatbot.api.dto.ChatDtoMapper;
import com.company.chatbot.api.dto.ChatHistoryResponse;
import com.company.chatbot.api.dto.ChatMessageDto;
import com.company.chatbot.api.dto.ChatSessionDto;
import com.company.chatbot.api.dto.CloseSessionResponse;
import com.company.chatbot.api.dto.SendMessageRequest;
import com.company.chatbot.api.dto.SendMessageResponse;
import com.company.chatbot.chat.ChatMessage;
import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.chat.ChatSessionService;
import com.company.chatbot.chat.MessageAppendResult;
import com.company.chatbot.chat.SubmitMessageRequest;
import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.security.AuditLogService;
import com.company.chatbot.security.validation.ChatMessageValidator;
import com.company.chatbot.security.validation.IdValidator;
import com.company.chatbot.security.validation.WorkflowRequestValidator;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * REST controller for the chat session lifecycle.
 *
 * <p>All endpoints require an authenticated caller with at least the CUSTOMER role.
 * Ownership of a session is validated inside {@link ChatSessionService} — a customer
 * can only access their own sessions; agents, managers, and admins may access any.</p>
 *
 * <h3>Endpoint summary</h3>
 * <ul>
 *   <li>{@code POST   /api/v1/chat/sessions}                       – create a new session</li>
 *   <li>{@code GET    /api/v1/chat/sessions/{sessionId}}            – get session details</li>
 *   <li>{@code POST   /api/v1/chat/sessions/{sessionId}/messages}   – submit a customer message</li>
 *   <li>{@code POST   /api/v1/chat/sessions/{sessionId}/close}      – close a session</li>
 *   <li>{@code GET    /api/v1/chat/sessions/{sessionId}/history}    – retrieve message transcript</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/chat/sessions")
@Validated
@PreAuthorize("hasAnyRole('CUSTOMER','AGENT','MANAGER','ADMIN','SYSTEM')")
public class ChatSessionController {

    private final ChatSessionService sessionService;
    private final AuditLogService auditLogService;

    public ChatSessionController(ChatSessionService sessionService, AuditLogService auditLogService) {
        this.sessionService = sessionService;
        this.auditLogService = auditLogService;
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/chat/sessions
    // -----------------------------------------------------------------------

    /**
     * Create a new chat session for the authenticated customer.
     *
     * @param customer authenticated customer context (resolved from JWT)
     * @param request  optional body containing arbitrary session metadata
     * @return 201 Created with the new {@link ChatSessionDto}
     */
    @PostMapping
    public ResponseEntity<ChatSessionDto> createSession(
            @CurrentCustomer CustomerContext customer,
            @RequestBody(required = false) CreateSessionRequest request) {

        Map<String, Object> metadata = WorkflowRequestValidator.validateMetadata(
                request != null ? request.getMetadata() : Map.of());

        ChatSession session = sessionService.createSession(customer, metadata);

        auditLogService.logSensitiveAction(
                customer,
                "CHAT_SESSION_CREATED",
                "chat_session",
                session.getId(),
                Map.of("status", session.getStatus().name())
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ChatDtoMapper.toDto(session));
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/chat/sessions/{sessionId}
    // -----------------------------------------------------------------------

    /**
     * Retrieve details of an existing session.
     *
     * <p>Ownership is enforced by the service: a CUSTOMER caller will only be able to
     * resume their own session; AGENT/MANAGER/ADMIN callers receive a broader view
     * through the same path because the service omits the customer-ID filter for
     * elevated roles.</p>
     *
     * @param sessionId path variable
     * @param customer  authenticated customer context
     * @return 200 OK with {@link ChatSessionDto}, or 404 if not found / not owned
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ChatSessionDto> getSession(
            @PathVariable String sessionId,
            @CurrentCustomer CustomerContext customer) {

        String validatedId = IdValidator.requireValidSessionId(sessionId);
        String customerId = customer != null ? customer.getCustomerId() : null;

        // resumeSession validates ownership and that the session is not closed
        ChatSession session = sessionService.resumeSession(validatedId, customerId);
        return ResponseEntity.ok(ChatDtoMapper.toDto(session));
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/chat/sessions/{sessionId}/messages
    // -----------------------------------------------------------------------

    /**
     * Submit a customer message to the session transcript.
     *
     * <p>The customer message is persisted immediately. The AI pipeline (Task #15)
     * processes the message asynchronously; the {@code aiResponse} field in the
     * response body is currently {@code null} and will be populated once the AI
     * integration is complete. The WebSocket channel (Task #11) will stream the
     * AI reply to the client in real time.</p>
     *
     * @param sessionId path variable
     * @param body      validated request body containing the message content
     * @param customer  authenticated customer context
     * @return 200 OK with {@link SendMessageResponse}
     */
    @PostMapping("/{sessionId}/messages")
    public ResponseEntity<SendMessageResponse> sendMessage(
            @PathVariable String sessionId,
            @Valid @RequestBody SendMessageRequest body,
            @CurrentCustomer CustomerContext customer) {

        String validatedId = IdValidator.requireValidSessionId(sessionId);
        String sanitizedContent = ChatMessageValidator.validate(body.getContent());

        SubmitMessageRequest serviceRequest = SubmitMessageRequest.customerMessage(validatedId, sanitizedContent);
        MessageAppendResult result = sessionService.appendMessage(serviceRequest);

        ChatMessageDto messageDto = ChatDtoMapper.toDto(result.getMessage());
        ChatSessionDto sessionDto = ChatDtoMapper.toDto(result.getSession());

        // aiResponse is null until AI pipeline (Task #15) is wired in
        return ResponseEntity.ok(new SendMessageResponse(messageDto, sessionDto, null));
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/chat/sessions/{sessionId}/close
    // -----------------------------------------------------------------------

    /**
     * Close an open or active session, preventing further message appends.
     *
     * <p>This operation is idempotent: closing an already-closed session returns the
     * current session state without error.</p>
     *
     * @param sessionId path variable
     * @param customer  authenticated customer context
     * @return 200 OK with {@link CloseSessionResponse}
     */
    @PostMapping("/{sessionId}/close")
    public ResponseEntity<CloseSessionResponse> closeSession(
            @PathVariable String sessionId,
            @CurrentCustomer CustomerContext customer) {

        String validatedId = IdValidator.requireValidSessionId(sessionId);
        String customerId = customer != null ? customer.getCustomerId() : null;

        ChatSession closed = sessionService.closeSession(validatedId, customerId);

        auditLogService.logSensitiveAction(
                customer,
                "CHAT_SESSION_CLOSED",
                "chat_session",
                closed.getId(),
                Map.of("status", closed.getStatus().name())
        );

        ChatSessionDto sessionDto = ChatDtoMapper.toDto(closed);
        return ResponseEntity.ok(new CloseSessionResponse(sessionDto, "Session closed successfully"));
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/chat/sessions/{sessionId}/history
    // -----------------------------------------------------------------------

    /**
     * Retrieve the full ordered message transcript for a session.
     *
     * <p>Returns messages in chronological order (oldest first).  History is always
     * fetched directly from MongoDB to ensure completeness — the Redis cache only
     * holds active-session state, not the message list.</p>
     *
     * @param sessionId path variable
     * @return 200 OK with {@link ChatHistoryResponse}
     */
    @GetMapping("/{sessionId}/history")
    public ResponseEntity<ChatHistoryResponse> getHistory(
            @PathVariable String sessionId) {

        String validatedId = IdValidator.requireValidSessionId(sessionId);

        List<ChatMessage> messages = sessionService.getHistory(validatedId);
        List<ChatMessageDto> messageDtos = ChatDtoMapper.toDtoList(messages);

        return ResponseEntity.ok(new ChatHistoryResponse(validatedId, messageDtos));
    }

    // -----------------------------------------------------------------------
    // Inner request types
    // -----------------------------------------------------------------------

    /**
     * Optional request body for session creation, allowing callers to attach
     * arbitrary key-value metadata (e.g. channel, locale, device info).
     */
    public static class CreateSessionRequest {

        private Map<String, Object> metadata;

        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }
}
