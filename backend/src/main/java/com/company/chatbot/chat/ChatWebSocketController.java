package com.company.chatbot.chat;

import com.company.chatbot.chat.ws.InboundChatMessage;
import com.company.chatbot.chat.ws.OutboundChatMessage;
import com.company.chatbot.chat.ws.WebSocketErrorMessage;
import com.company.chatbot.security.AuthenticatedUser;
import com.company.chatbot.security.validation.ChatMessageValidator;
import com.company.chatbot.security.validation.IdValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import java.security.Principal;

/**
 * STOMP message handler for the chat WebSocket API.
 *
 * <h3>Message flow</h3>
 * <ol>
 *   <li>Client sends a STOMP {@code SEND} frame to {@code /app/chat.send} with a JSON
 *       {@link InboundChatMessage} payload.</li>
 *   <li>This handler validates the payload, resolves the caller identity from the
 *       STOMP session principal, and appends the message via {@link ChatSessionService}.</li>
 *   <li>The persisted message is published to two destinations:
 *     <ul>
 *       <li>{@code /topic/chat.sessions.{sessionId}} – broadcast to all subscribers of
 *           this session (agents, monitoring dashboards, other participants).</li>
 *       <li>{@code /user/queue/chat} – routed only to the message sender's private
 *           queue so the sender receives their own message echoed back with server
 *           metadata (timestamp, message ID, session status).</li>
 *     </ul>
 *   </li>
 *   <li>Validation and processing errors are caught by {@link #handleException} and
 *       sent to {@code /user/queue/errors}.</li>
 * </ol>
 *
 * <p>Authentication is enforced at the STOMP {@code CONNECT} level by
 * {@link com.company.chatbot.security.WebSocketAuthChannelInterceptor}; by the time a
 * message reaches this handler the session principal is guaranteed to be set.</p>
 */
@Controller
@Validated
public class ChatWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketController.class);

    private static final String TOPIC_SESSION_PREFIX = "/topic/chat.sessions.";
    private static final String USER_QUEUE_CHAT = "/queue/chat";
    private static final String USER_QUEUE_ERRORS = "/queue/errors";

    private final ChatSessionService sessionService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(ChatSessionService sessionService,
                                    SimpMessagingTemplate messagingTemplate) {
        this.sessionService = sessionService;
        this.messagingTemplate = messagingTemplate;
    }

    // -----------------------------------------------------------------------
    // /app/chat.send
    // -----------------------------------------------------------------------

    /**
     * Handle a customer message sent over WebSocket.
     *
     * <p>Validates the payload, appends the message to the transcript, then publishes
     * the persisted message to both the session topic and the sender's private queue.</p>
     *
     * @param inbound   the validated inbound message payload
     * @param principal the STOMP session principal (set by {@code WebSocketAuthChannelInterceptor})
     * @param headerAccessor provides access to STOMP session headers
     */
    @MessageMapping("/chat.send")
    public void handleChatMessage(
            @Payload InboundChatMessage inbound,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor) {

        // --- Validate inputs ---
        String sessionId = IdValidator.requireValidSessionId(inbound.getSessionId());
        String content = ChatMessageValidator.validate(inbound.getContent());

        // --- Resolve caller identity ---
        String customerId = resolveCustomerId(principal);
        String username = resolveUsername(principal);

        log.debug("WebSocket message received: sessionId={} customerId={}", sessionId, customerId);

        // --- Persist via service ---
        SubmitMessageRequest request = SubmitMessageRequest.customerMessage(sessionId, content);
        MessageAppendResult result = sessionService.appendMessage(request);

        ChatMessage persistedMessage = result.getMessage();
        ChatSession updatedSession = result.getSession();

        // --- Build outbound payload ---
        OutboundChatMessage outbound = OutboundChatMessage.of(
                persistedMessage.getId(),
                persistedMessage.getSessionId(),
                persistedMessage.getSenderType() != null
                        ? persistedMessage.getSenderType().name() : null,
                customerId,
                persistedMessage.getContent(),
                persistedMessage.getTimestamp(),
                updatedSession.getStatus() != null
                        ? updatedSession.getStatus().name() : null
        );

        // --- Publish to session topic (all subscribers, e.g. agents) ---
        messagingTemplate.convertAndSend(
                TOPIC_SESSION_PREFIX + sessionId, outbound);

        // --- Publish to sender's private queue (echo with server metadata) ---
        if (username != null) {
            messagingTemplate.convertAndSendToUser(
                    username, USER_QUEUE_CHAT, outbound);
        }

        log.debug("WebSocket message published: messageId={} sessionId={}",
                persistedMessage.getId(), sessionId);
    }

    // -----------------------------------------------------------------------
    // Exception handler
    // -----------------------------------------------------------------------

    /**
     * Catches validation or processing exceptions thrown by {@link #handleChatMessage}
     * and delivers an error payload to the sender's private error queue.
     */
    @MessageExceptionHandler
    @SendToUser(USER_QUEUE_ERRORS)
    public WebSocketErrorMessage handleException(Exception ex, Principal principal) {
        log.warn("WebSocket message handler error for user={}: {}",
                resolveUsername(principal), ex.getMessage());

        String errorCode = ex instanceof IllegalArgumentException
                ? "validation_error" : "processing_error";
        return WebSocketErrorMessage.of(errorCode, ex.getMessage());
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private String resolveCustomerId(Principal principal) {
        if (principal instanceof org.springframework.security.core.Authentication auth) {
            Object p = auth.getPrincipal();
            if (p instanceof AuthenticatedUser user) {
                return user.getCustomerId();
            }
        }
        return principal != null ? principal.getName() : null;
    }

    private String resolveUsername(Principal principal) {
        if (principal == null) return null;
        return principal.getName();
    }
}
