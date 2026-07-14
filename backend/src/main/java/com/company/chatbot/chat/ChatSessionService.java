package com.company.chatbot.chat;

import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.intent.IntentClassification;
import com.company.chatbot.intent.IntentClassificationService;
import com.company.chatbot.persistence.mongo.ChatMessageDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatMessageMapper;
import com.company.chatbot.persistence.mongo.ChatSessionDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatSessionMapper;
import com.company.chatbot.persistence.redis.ChatSessionCacheMapper;
import com.company.chatbot.persistence.redis.ChatSessionCacheRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing the full lifecycle of a customer chat session.
 *
 * <h3>Persistence strategy</h3>
 * <ul>
 *   <li><b>MongoDB</b> – durable source of truth for session documents and the full
 *       message transcript ({@code chat_sessions}, {@code chat_messages} collections).</li>
 *   <li><b>Redis</b> – active-session hot cache ({@code chat:session:{sessionId}}) for
 *       low-latency reads while a session is open.  Deleted on close.</li>
 * </ul>
 *
 * <h3>Workflow summary</h3>
 * <ol>
 *   <li>{@link #createSession} – initialises a new OPEN session in MongoDB and primes
 *       the Redis cache.</li>
 *   <li>{@link #resumeSession} – loads an existing OPEN or ACTIVE session, refreshes
 *       the Redis TTL, and returns the domain object.</li>
 *   <li>{@link #appendMessage} – persists a message to MongoDB with full metadata, then
 *       transitions the session to ACTIVE and refreshes the cache.</li>
 *   <li>{@link #closeSession} – marks the session CLOSED in MongoDB and evicts the
 *       Redis entry.</li>
 *   <li>{@link #getHistory} – returns the full ordered transcript from MongoDB.</li>
 * </ol>
 */
@Service
public class ChatSessionService {

    private static final Logger log = LoggerFactory.getLogger(ChatSessionService.class);

    private final ChatSessionDocumentRepository sessionRepository;
    private final ChatMessageDocumentRepository messageRepository;

    /**
     * Optional – only wired when {@code persistence.redis.enabled=true} (the default).
     * When null every Redis operation is silently skipped so the service stays functional
     * in test environments without a Redis container.
     */
    private ChatSessionCacheRepository sessionCacheRepository;

    /**
     * Optional – wired when the intent classification feature is available.
     * When null, intent classification is silently skipped and the message is stored
     * without an intent type (callers may supply one explicitly via {@link SubmitMessageRequest}).
     */
    private IntentClassificationService intentClassificationService;

    public ChatSessionService(ChatSessionDocumentRepository sessionRepository,
                              ChatMessageDocumentRepository messageRepository) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
    }

    @Autowired(required = false)
    public void setSessionCacheRepository(ChatSessionCacheRepository sessionCacheRepository) {
        this.sessionCacheRepository = sessionCacheRepository;
    }

    @Autowired(required = false)
    public void setIntentClassificationService(IntentClassificationService intentClassificationService) {
        this.intentClassificationService = intentClassificationService;
    }

    // -----------------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------------

    /**
     * Create a new chat session for the given customer context.
     *
     * <p>The session is persisted to MongoDB with status {@code OPEN} and optionally
     * mirrored to the Redis active-session cache.</p>
     *
     * @param customerContext authenticated customer; may be {@code null} for anonymous callers
     * @param metadata        arbitrary key-value metadata attached at creation time
     * @return the persisted {@link ChatSession}
     */
    public ChatSession createSession(CustomerContext customerContext, Map<String, Object> metadata) {
        String id = UUID.randomUUID().toString();
        String customerId = customerContext != null ? customerContext.getCustomerId() : null;
        Instant now = Instant.now();

        ChatSession session = new ChatSession(
                id,
                customerId,
                ChatSessionStatus.OPEN,
                null,
                null,
                now,
                now,
                null,
                metadata
        );

        ChatSession persisted = ChatSessionMapper.toDomain(
                sessionRepository.save(ChatSessionMapper.toDocument(session)));

        cacheSession(persisted);

        log.debug("chat session created sessionId={} customerId={}", id, customerId);
        return persisted;
    }

    // -----------------------------------------------------------------------
    // Resume
    // -----------------------------------------------------------------------

    /**
     * Resume an existing session.
     *
     * <p>The lookup first checks the Redis hot cache; on a cache miss it falls back to
     * MongoDB.  Only sessions in {@code OPEN} or {@code ACTIVE} status can be resumed —
     * a {@code CLOSED} or {@code ESCALATED} session throws
     * {@link ChatSessionNotFoundException}.</p>
     *
     * @param sessionId  the session to resume
     * @param customerId the customer that owns the session (used for ownership check)
     * @return the resumed {@link ChatSession}
     * @throws ChatSessionNotFoundException if the session does not exist, is closed, or does not belong to the customer
     */
    public ChatSession resumeSession(String sessionId, String customerId) {
        // 1. Hot cache hit
        if (sessionCacheRepository != null) {
            Optional<ChatSession> cached = sessionCacheRepository
                    .findBySessionId(sessionId)
                    .map(ChatSessionCacheMapper::toDomain);

            if (cached.isPresent()) {
                ChatSession session = cached.get();
                validateOwnershipAndStatus(session, customerId);
                sessionCacheRepository.refreshTtl(sessionId);
                log.debug("chat session resumed from cache sessionId={}", sessionId);
                return session;
            }
        }

        // 2. MongoDB fallback
        ChatSession session = loadFromMongo(sessionId, customerId);
        validateOwnershipAndStatus(session, customerId);

        // Re-prime the cache (session was evicted or Redis was unavailable)
        cacheSession(session);

        log.debug("chat session resumed from MongoDB sessionId={}", sessionId);
        return session;
    }

    // -----------------------------------------------------------------------
    // Append message
    // -----------------------------------------------------------------------

    /**
     * Append a message to the transcript and update session state.
     *
     * <p>Steps:
     * <ol>
     *   <li>Verify the session exists and is not closed.</li>
     *   <li>Build a {@link ChatMessage} with all supplied metadata fields.</li>
     *   <li>Persist the message to the {@code chat_messages} MongoDB collection.</li>
     *   <li>Advance session status to {@code ACTIVE} and update {@code updatedAt}.</li>
     *   <li>Persist the updated session to MongoDB.</li>
     *   <li>Refresh the Redis cache entry.</li>
     * </ol>
     * </p>
     *
     * @param request fully populated message request
     * @return {@link MessageAppendResult} containing the persisted message and updated session
     * @throws ChatSessionNotFoundException if the session is not found or is already closed
     */
    public MessageAppendResult appendMessage(SubmitMessageRequest request) {
        String sessionId = request.getSessionId();

        // Load current session (cache-first)
        ChatSession session = resolveSession(sessionId);

        if (session.getStatus() == ChatSessionStatus.CLOSED) {
            throw new ChatSessionNotFoundException(
                    "Cannot append message: session is already closed. sessionId=" + sessionId);
        }

        Instant now = Instant.now();

        // Classify intent when not supplied by the caller and the service is available
        com.company.chatbot.common.enums.IntentType intentType = request.getIntentType();
        double confidenceScore = request.getConfidenceScore();
        com.company.chatbot.common.enums.ConfidenceLevel confidenceLevel = request.getConfidenceLevel();

        if (intentType == null && intentClassificationService != null
                && request.getSenderType() == com.company.chatbot.common.enums.MessageSenderType.CUSTOMER) {
            try {
                IntentClassification classification = intentClassificationService.classify(request.getContent());
                intentType      = classification.getIntentType();
                confidenceScore = classification.getConfidenceScore();
                confidenceLevel = classification.getConfidenceLevel();
                log.debug("intent classified sessionId={} intent={} score={}",
                        sessionId, intentType, confidenceScore);
            } catch (Exception ex) {
                log.warn("Intent classification failed for sessionId={}: {}", sessionId, ex.getMessage());
            }
        }

        // Build message domain object
        ChatMessage message = new ChatMessage(
                UUID.randomUUID().toString(),
                sessionId,
                request.getSenderType(),
                request.getContent(),
                now,
                intentType,
                confidenceLevel,
                confidenceScore,
                request.getResponseLatencyMs(),
                request.isEscalationFlag(),
                request.getMetadata()
        );

        // Persist message to MongoDB
        ChatMessage persistedMessage = ChatMessageMapper.toDomain(
                messageRepository.save(ChatMessageMapper.toDocument(message)));

        // Advance session to ACTIVE and bump updatedAt
        session.setStatus(ChatSessionStatus.ACTIVE);
        session.setUpdatedAt(now);

        ChatSession updatedSession = ChatSessionMapper.toDomain(
                sessionRepository.save(ChatSessionMapper.toDocument(session)));

        // Refresh Redis cache
        cacheSession(updatedSession);

        log.debug("message appended sessionId={} messageId={} sender={}",
                sessionId, persistedMessage.getId(), request.getSenderType());

        return new MessageAppendResult(persistedMessage, updatedSession);
    }

    // -----------------------------------------------------------------------
    // Close
    // -----------------------------------------------------------------------

    /**
     * Close a session, preventing further message appends.
     *
     * <p>Sets status to {@code CLOSED}, records {@code closedAt}, persists to MongoDB,
     * and evicts the Redis cache entry.</p>
     *
     * @param sessionId  the session to close
     * @param customerId the customer that owns the session
     * @return the closed {@link ChatSession}
     * @throws ChatSessionNotFoundException if the session is not found or does not belong to the customer
     */
    public ChatSession closeSession(String sessionId, String customerId) {
        ChatSession session = loadFromMongo(sessionId, customerId);
        validateOwnership(session, customerId);

        if (session.getStatus() == ChatSessionStatus.CLOSED) {
            // Idempotent – already closed, just return current state
            log.debug("chat session already closed sessionId={}", sessionId);
            return session;
        }

        Instant now = Instant.now();
        session.setStatus(ChatSessionStatus.CLOSED);
        session.setUpdatedAt(now);
        session.setClosedAt(now);

        ChatSession closed = ChatSessionMapper.toDomain(
                sessionRepository.save(ChatSessionMapper.toDocument(session)));

        // Evict from Redis – closed sessions are not needed in the active cache
        if (sessionCacheRepository != null) {
            sessionCacheRepository.deleteBySessionId(sessionId);
        }

        log.debug("chat session closed sessionId={} customerId={}", sessionId, customerId);
        return closed;
    }

    // -----------------------------------------------------------------------
    // History
    // -----------------------------------------------------------------------

    /**
     * Retrieve the full ordered message transcript for a session from MongoDB.
     *
     * @param sessionId the session whose history to fetch
     * @return messages in chronological order (oldest first)
     */
    public List<ChatMessage> getHistory(String sessionId) {
        List<ChatMessage> history = messageRepository
                .findBySessionIdOrderByTimestampAsc(sessionId)
                .stream()
                .map(ChatMessageMapper::toDomain)
                .collect(Collectors.toList());

        log.debug("history retrieved sessionId={} messageCount={}", sessionId, history.size());
        return history;
    }

    // -----------------------------------------------------------------------
    // Query helpers
    // -----------------------------------------------------------------------

    /**
     * Find all sessions belonging to a customer ordered by creation date descending.
     */
    public List<ChatSession> findByCustomerId(String customerId) {
        return sessionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(ChatSessionMapper::toDomain)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    /**
     * Resolve a session from the Redis cache, falling back to MongoDB.
     * Does not validate ownership or status.
     */
    private ChatSession resolveSession(String sessionId) {
        if (sessionCacheRepository != null) {
            Optional<ChatSession> cached = sessionCacheRepository
                    .findBySessionId(sessionId)
                    .map(ChatSessionCacheMapper::toDomain);
            if (cached.isPresent()) {
                return cached.get();
            }
        }
        return sessionRepository.findById(sessionId)
                .map(ChatSessionMapper::toDomain)
                .orElseThrow(() -> new ChatSessionNotFoundException(
                        "Chat session not found. sessionId=" + sessionId));
    }

    /**
     * Load a session from MongoDB and verify it belongs to the given customer.
     */
    private ChatSession loadFromMongo(String sessionId, String customerId) {
        return sessionRepository.findByIdAndCustomerId(sessionId, customerId)
                .map(ChatSessionMapper::toDomain)
                .orElseThrow(() -> new ChatSessionNotFoundException(
                        "Chat session not found for customer. sessionId=" + sessionId));
    }

    private void validateOwnershipAndStatus(ChatSession session, String customerId) {
        validateOwnership(session, customerId);
        if (session.getStatus() == ChatSessionStatus.CLOSED) {
            throw new ChatSessionNotFoundException(
                    "Chat session is closed. sessionId=" + session.getId());
        }
    }

    private void validateOwnership(ChatSession session, String customerId) {
        if (customerId != null && !customerId.equals(session.getCustomerId())) {
            throw new ChatSessionNotFoundException(
                    "Chat session not found for customer. sessionId=" + session.getId());
        }
    }

    private void cacheSession(ChatSession session) {
        if (sessionCacheRepository != null) {
            try {
                sessionCacheRepository.save(ChatSessionCacheMapper.toCacheEntry(session));
            } catch (Exception ex) {
                // Redis is best-effort; never let a cache failure break the write path
                log.warn("Failed to cache session sessionId={}: {}", session.getId(), ex.getMessage());
            }
        }
    }
}
