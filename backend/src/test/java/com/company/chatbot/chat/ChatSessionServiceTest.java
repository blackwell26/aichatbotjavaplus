package com.company.chatbot.chat;

import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.MessageSenderType;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.persistence.mongo.ChatMessageDocument;
import com.company.chatbot.persistence.mongo.ChatMessageDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatSessionDocument;
import com.company.chatbot.persistence.mongo.ChatSessionDocumentRepository;
import com.company.chatbot.persistence.redis.ChatSessionCacheRepository;
import com.company.chatbot.persistence.redis.model.ChatSessionCacheEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ChatSessionService}.
 *
 * <p>All external dependencies (MongoDB repositories, Redis cache) are mocked with
 * Mockito so no containers are required to run this test class.</p>
 */
@ExtendWith(MockitoExtension.class)
class ChatSessionServiceTest {

    @Mock
    private ChatSessionDocumentRepository sessionRepository;

    @Mock
    private ChatMessageDocumentRepository messageRepository;

    @Mock
    private ChatSessionCacheRepository sessionCacheRepository;

    // Use constructor injection so the optional @Autowired setter can also be set
    private ChatSessionService service;

    private static final String CUSTOMER_ID = "customer-abc";
    private static final String SESSION_ID   = "session-xyz";

    @BeforeEach
    void setUp() {
        service = new ChatSessionService(sessionRepository, messageRepository);
        // Wire the optional Redis repo (normally done by Spring via @Autowired)
        service.setSessionCacheRepository(sessionCacheRepository);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private ChatSessionDocument openSessionDoc(String sessionId, String customerId) {
        ChatSessionDocument doc = new ChatSessionDocument();
        doc.setId(sessionId);
        doc.setCustomerId(customerId);
        doc.setStatus("OPEN");
        doc.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        doc.setUpdatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        return doc;
    }

    private ChatSessionDocument activeSessionDoc(String sessionId, String customerId) {
        ChatSessionDocument doc = openSessionDoc(sessionId, customerId);
        doc.setStatus("ACTIVE");
        return doc;
    }

    private ChatSessionDocument closedSessionDoc(String sessionId, String customerId) {
        ChatSessionDocument doc = openSessionDoc(sessionId, customerId);
        doc.setStatus("CLOSED");
        doc.setClosedAt(Instant.parse("2026-01-01T11:00:00Z"));
        return doc;
    }

    private ChatMessageDocument messageDoc(String id, String sessionId, String senderType, String content) {
        ChatMessageDocument doc = new ChatMessageDocument();
        doc.setId(id);
        doc.setSessionId(sessionId);
        doc.setSenderType(senderType);
        doc.setContent(content);
        doc.setTimestamp(Instant.parse("2026-01-01T10:05:00Z"));
        return doc;
    }

    private CustomerContext customerContext() {
        return new CustomerContext(CUSTOMER_ID, "alice", List.of("ROLE_CUSTOMER"));
    }

    // -----------------------------------------------------------------------
    // createSession
    // -----------------------------------------------------------------------

    @Nested
    class CreateSession {

        @Test
        void persistsNewSessionToMongoWithOpenStatus() {
            ChatSessionDocument saved = openSessionDoc(SESSION_ID, CUSTOMER_ID);
            when(sessionRepository.save(any())).thenReturn(saved);

            ChatSession result = service.createSession(customerContext(), Map.of("channel", "web"));

            ArgumentCaptor<ChatSessionDocument> captor = ArgumentCaptor.forClass(ChatSessionDocument.class);
            verify(sessionRepository).save(captor.capture());

            ChatSessionDocument captured = captor.getValue();
            assertEquals(CUSTOMER_ID, captured.getCustomerId());
            assertEquals("OPEN", captured.getStatus());
            assertNotNull(captured.getId());
            assertNotNull(captured.getCreatedAt());

            assertEquals(ChatSessionStatus.OPEN, result.getStatus());
            assertEquals(CUSTOMER_ID, result.getCustomerId());
        }

        @Test
        void primesRedisCacheAfterMongoPersist() {
            ChatSessionDocument saved = openSessionDoc(SESSION_ID, CUSTOMER_ID);
            when(sessionRepository.save(any())).thenReturn(saved);

            service.createSession(customerContext(), Map.of());

            verify(sessionCacheRepository).save(any(ChatSessionCacheEntry.class));
        }

        @Test
        void handlesNullCustomerContext() {
            ChatSessionDocument saved = openSessionDoc(SESSION_ID, null);
            when(sessionRepository.save(any())).thenReturn(saved);

            ChatSession result = service.createSession(null, Map.of());

            assertNull(result.getCustomerId());
        }
    }

    // -----------------------------------------------------------------------
    // resumeSession
    // -----------------------------------------------------------------------

    @Nested
    class ResumeSession {

        @Test
        void returnsSessionFromRedisHotCache() {
            ChatSessionCacheEntry cacheEntry = new ChatSessionCacheEntry();
            cacheEntry.setSessionId(SESSION_ID);
            cacheEntry.setCustomerId(CUSTOMER_ID);
            cacheEntry.setStatus("ACTIVE");
            cacheEntry.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
            cacheEntry.setUpdatedAt(Instant.parse("2026-01-01T10:00:00Z"));

            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.of(cacheEntry));

            ChatSession result = service.resumeSession(SESSION_ID, CUSTOMER_ID);

            assertEquals(SESSION_ID, result.getId());
            assertEquals(ChatSessionStatus.ACTIVE, result.getStatus());
            // MongoDB should NOT be called on a cache hit
            verifyNoInteractions(sessionRepository);
        }

        @Test
        void refreshesTtlOnCacheHit() {
            ChatSessionCacheEntry cacheEntry = new ChatSessionCacheEntry();
            cacheEntry.setSessionId(SESSION_ID);
            cacheEntry.setCustomerId(CUSTOMER_ID);
            cacheEntry.setStatus("OPEN");
            cacheEntry.setCreatedAt(Instant.now());
            cacheEntry.setUpdatedAt(Instant.now());

            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.of(cacheEntry));

            service.resumeSession(SESSION_ID, CUSTOMER_ID);

            verify(sessionCacheRepository).refreshTtl(SESSION_ID);
        }

        @Test
        void fallsBackToMongoOnCacheMiss() {
            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.empty());
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(activeSessionDoc(SESSION_ID, CUSTOMER_ID)));

            ChatSession result = service.resumeSession(SESSION_ID, CUSTOMER_ID);

            assertEquals(SESSION_ID, result.getId());
            verify(sessionRepository).findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID);
        }

        @Test
        void reprimesRedisAfterMongoFallback() {
            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.empty());
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(openSessionDoc(SESSION_ID, CUSTOMER_ID)));

            service.resumeSession(SESSION_ID, CUSTOMER_ID);

            verify(sessionCacheRepository).save(any(ChatSessionCacheEntry.class));
        }

        @Test
        void throwsWhenSessionNotFound() {
            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.empty());
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.empty());

            assertThrows(ChatSessionNotFoundException.class,
                    () -> service.resumeSession(SESSION_ID, CUSTOMER_ID));
        }

        @Test
        void throwsWhenSessionIsClosed() {
            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.empty());
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(closedSessionDoc(SESSION_ID, CUSTOMER_ID)));

            assertThrows(ChatSessionNotFoundException.class,
                    () -> service.resumeSession(SESSION_ID, CUSTOMER_ID));
        }

        @Test
        void throwsWhenOwnershipMismatch() {
            ChatSessionCacheEntry cacheEntry = new ChatSessionCacheEntry();
            cacheEntry.setSessionId(SESSION_ID);
            cacheEntry.setCustomerId("other-customer");
            cacheEntry.setStatus("ACTIVE");
            cacheEntry.setCreatedAt(Instant.now());
            cacheEntry.setUpdatedAt(Instant.now());

            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.of(cacheEntry));

            assertThrows(ChatSessionNotFoundException.class,
                    () -> service.resumeSession(SESSION_ID, CUSTOMER_ID));
        }
    }

    // -----------------------------------------------------------------------
    // appendMessage
    // -----------------------------------------------------------------------

    @Nested
    class AppendMessage {

        private SubmitMessageRequest customerRequest() {
            return SubmitMessageRequest.customerMessage(SESSION_ID, "Where is my order?");
        }

        private SubmitMessageRequest aiRequest() {
            return SubmitMessageRequest.aiMessage(
                    SESSION_ID,
                    "Your order is on the way!",
                    IntentType.ORDER_STATUS,
                    ConfidenceLevel.HIGH,
                    0.95,
                    820L,
                    false
            );
        }

        @Test
        void persistsCustomerMessageToMongo() {
            stubOpenSessionInCache();
            when(messageRepository.save(any())).thenAnswer(inv -> {
                ChatMessageDocument doc = inv.getArgument(0);
                doc.setId("msg-1");
                return doc;
            });
            when(sessionRepository.save(any())).thenReturn(activeSessionDoc(SESSION_ID, CUSTOMER_ID));

            MessageAppendResult result = service.appendMessage(customerRequest());

            ArgumentCaptor<ChatMessageDocument> captor = ArgumentCaptor.forClass(ChatMessageDocument.class);
            verify(messageRepository).save(captor.capture());

            ChatMessageDocument captured = captor.getValue();
            assertEquals(SESSION_ID, captured.getSessionId());
            assertEquals("CUSTOMER", captured.getSenderType());
            assertEquals("Where is my order?", captured.getContent());
            assertNotNull(captured.getTimestamp());
        }

        @Test
        void persistsAiMessageWithFullMetadata() {
            stubOpenSessionInCache();
            when(messageRepository.save(any())).thenAnswer(inv -> {
                ChatMessageDocument doc = inv.getArgument(0);
                doc.setId("msg-2");
                return doc;
            });
            when(sessionRepository.save(any())).thenReturn(activeSessionDoc(SESSION_ID, CUSTOMER_ID));

            MessageAppendResult result = service.appendMessage(aiRequest());

            ArgumentCaptor<ChatMessageDocument> captor = ArgumentCaptor.forClass(ChatMessageDocument.class);
            verify(messageRepository).save(captor.capture());

            ChatMessageDocument captured = captor.getValue();
            assertEquals("AI", captured.getSenderType());
            assertEquals("ORDER_STATUS", captured.getIntentType());
            assertEquals("HIGH", captured.getConfidenceLevel());
            assertEquals(0.95, captured.getConfidenceScore());
            assertEquals(820L, captured.getResponseLatencyMs());
            assertFalse(captured.isEscalationFlag());
        }

        @Test
        void transitionsSessionStatusToActive() {
            stubOpenSessionInCache();
            when(messageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(sessionRepository.save(any())).thenReturn(activeSessionDoc(SESSION_ID, CUSTOMER_ID));

            service.appendMessage(customerRequest());

            ArgumentCaptor<ChatSessionDocument> captor = ArgumentCaptor.forClass(ChatSessionDocument.class);
            verify(sessionRepository).save(captor.capture());
            assertEquals("ACTIVE", captor.getValue().getStatus());
        }

        @Test
        void updatesSessionUpdatedAt() {
            stubOpenSessionInCache();
            Instant before = Instant.now();
            when(messageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.appendMessage(customerRequest());

            ArgumentCaptor<ChatSessionDocument> captor = ArgumentCaptor.forClass(ChatSessionDocument.class);
            verify(sessionRepository).save(captor.capture());
            assertTrue(captor.getValue().getUpdatedAt() != null
                    && !captor.getValue().getUpdatedAt().isBefore(before));
        }

        @Test
        void refreshesRedisCacheAfterAppend() {
            stubOpenSessionInCache();
            when(messageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(sessionRepository.save(any())).thenReturn(activeSessionDoc(SESSION_ID, CUSTOMER_ID));

            service.appendMessage(customerRequest());

            // save() is called once for createSession (in stubOpenSessionInCache) and once on append
            verify(sessionCacheRepository, atLeastOnce()).save(any(ChatSessionCacheEntry.class));
        }

        @Test
        void returnsPersistedMessageAndUpdatedSession() {
            stubOpenSessionInCache();
            when(messageRepository.save(any())).thenAnswer(inv -> {
                ChatMessageDocument doc = inv.getArgument(0);
                doc.setId("msg-99");
                return doc;
            });
            when(sessionRepository.save(any())).thenReturn(activeSessionDoc(SESSION_ID, CUSTOMER_ID));

            MessageAppendResult result = service.appendMessage(customerRequest());

            assertNotNull(result.getMessage());
            assertNotNull(result.getSession());
            assertEquals(SESSION_ID, result.getMessage().getSessionId());
            assertEquals(ChatSessionStatus.ACTIVE, result.getSession().getStatus());
        }

        @Test
        void throwsWhenSessionIsClosed() {
            ChatSessionCacheEntry cacheEntry = new ChatSessionCacheEntry();
            cacheEntry.setSessionId(SESSION_ID);
            cacheEntry.setCustomerId(CUSTOMER_ID);
            cacheEntry.setStatus("CLOSED");
            cacheEntry.setCreatedAt(Instant.now());
            cacheEntry.setUpdatedAt(Instant.now());

            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.of(cacheEntry));

            assertThrows(ChatSessionNotFoundException.class,
                    () -> service.appendMessage(customerRequest()));
            verifyNoInteractions(messageRepository);
        }

        @Test
        void throwsWhenSessionNotFound() {
            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.empty());
            when(sessionRepository.findById(SESSION_ID)).thenReturn(Optional.empty());

            assertThrows(ChatSessionNotFoundException.class,
                    () -> service.appendMessage(customerRequest()));
        }

        private void stubOpenSessionInCache() {
            ChatSessionCacheEntry cacheEntry = new ChatSessionCacheEntry();
            cacheEntry.setSessionId(SESSION_ID);
            cacheEntry.setCustomerId(CUSTOMER_ID);
            cacheEntry.setStatus("OPEN");
            cacheEntry.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
            cacheEntry.setUpdatedAt(Instant.parse("2026-01-01T10:00:00Z"));
            when(sessionCacheRepository.findBySessionId(SESSION_ID)).thenReturn(Optional.of(cacheEntry));
        }
    }

    // -----------------------------------------------------------------------
    // closeSession
    // -----------------------------------------------------------------------

    @Nested
    class CloseSession {

        @Test
        void setsStatusToClosedAndRecordsClosedAt() {
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(activeSessionDoc(SESSION_ID, CUSTOMER_ID)));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Instant before = Instant.now();
            ChatSession result = service.closeSession(SESSION_ID, CUSTOMER_ID);

            assertEquals(ChatSessionStatus.CLOSED, result.getStatus());
            assertNotNull(result.getClosedAt());
            assertTrue(!result.getClosedAt().isBefore(before));
        }

        @Test
        void evictsRedisEntryOnClose() {
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(activeSessionDoc(SESSION_ID, CUSTOMER_ID)));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.closeSession(SESSION_ID, CUSTOMER_ID);

            verify(sessionCacheRepository).deleteBySessionId(SESSION_ID);
        }

        @Test
        void isIdempotentWhenAlreadyClosed() {
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(closedSessionDoc(SESSION_ID, CUSTOMER_ID)));

            ChatSession result = service.closeSession(SESSION_ID, CUSTOMER_ID);

            assertEquals(ChatSessionStatus.CLOSED, result.getStatus());
            // Should NOT call save again on an already-closed session
            verify(sessionRepository, never()).save(any());
        }

        @Test
        void persistsClosedSessionToMongo() {
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(openSessionDoc(SESSION_ID, CUSTOMER_ID)));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.closeSession(SESSION_ID, CUSTOMER_ID);

            ArgumentCaptor<ChatSessionDocument> captor = ArgumentCaptor.forClass(ChatSessionDocument.class);
            verify(sessionRepository).save(captor.capture());
            assertEquals("CLOSED", captor.getValue().getStatus());
            assertNotNull(captor.getValue().getClosedAt());
        }

        @Test
        void throwsWhenSessionNotFound() {
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.empty());

            assertThrows(ChatSessionNotFoundException.class,
                    () -> service.closeSession(SESSION_ID, CUSTOMER_ID));
        }
    }

    // -----------------------------------------------------------------------
    // getHistory
    // -----------------------------------------------------------------------

    @Nested
    class GetHistory {

        @Test
        void returnsMessagesInChronologicalOrderFromMongo() {
            Instant t1 = Instant.parse("2026-01-01T10:01:00Z");
            Instant t2 = Instant.parse("2026-01-01T10:02:00Z");

            ChatMessageDocument m1 = messageDoc("msg-1", SESSION_ID, "CUSTOMER", "Hello");
            m1.setTimestamp(t1);
            ChatMessageDocument m2 = messageDoc("msg-2", SESSION_ID, "AI", "Hi there!");
            m2.setTimestamp(t2);

            when(messageRepository.findBySessionIdOrderByTimestampAsc(SESSION_ID))
                    .thenReturn(List.of(m1, m2));

            List<ChatMessage> history = service.getHistory(SESSION_ID);

            assertEquals(2, history.size());
            assertEquals("msg-1", history.get(0).getId());
            assertEquals(MessageSenderType.CUSTOMER, history.get(0).getSenderType());
            assertEquals("msg-2", history.get(1).getId());
            assertEquals(MessageSenderType.AI, history.get(1).getSenderType());
        }

        @Test
        void returnsEmptyListForSessionWithNoMessages() {
            when(messageRepository.findBySessionIdOrderByTimestampAsc(SESSION_ID))
                    .thenReturn(List.of());

            List<ChatMessage> history = service.getHistory(SESSION_ID);

            assertTrue(history.isEmpty());
        }

        @Test
        void includesAllMetadataFieldsOnAiMessages() {
            ChatMessageDocument aiDoc = messageDoc("msg-ai", SESSION_ID, "AI", "Your order is shipped.");
            aiDoc.setIntentType("ORDER_STATUS");
            aiDoc.setConfidenceLevel("HIGH");
            aiDoc.setConfidenceScore(0.97);
            aiDoc.setResponseLatencyMs(750L);
            aiDoc.setEscalationFlag(false);

            when(messageRepository.findBySessionIdOrderByTimestampAsc(SESSION_ID))
                    .thenReturn(List.of(aiDoc));

            List<ChatMessage> history = service.getHistory(SESSION_ID);

            ChatMessage msg = history.get(0);
            assertEquals(IntentType.ORDER_STATUS, msg.getIntentType());
            assertEquals(ConfidenceLevel.HIGH, msg.getConfidenceLevel());
            assertEquals(0.97, msg.getConfidenceScore());
            assertEquals(750L, msg.getResponseLatencyMs());
            assertFalse(msg.isEscalationFlag());
        }
    }

    // -----------------------------------------------------------------------
    // SubmitMessageRequest validation
    // -----------------------------------------------------------------------

    @Nested
    class SubmitMessageRequestValidation {

        @Test
        void builderRejectsBlankSessionId() {
            assertThrows(IllegalArgumentException.class,
                    () -> new SubmitMessageRequest.Builder("", MessageSenderType.CUSTOMER, "Hello").build());
        }

        @Test
        void builderRejectsNullSenderType() {
            assertThrows(IllegalArgumentException.class,
                    () -> new SubmitMessageRequest.Builder(SESSION_ID, null, "Hello").build());
        }

        @Test
        void builderRejectsBlankContent() {
            assertThrows(IllegalArgumentException.class,
                    () -> new SubmitMessageRequest.Builder(SESSION_ID, MessageSenderType.CUSTOMER, " ").build());
        }

        @Test
        void customerMessageFactoryProducesCorrectRequest() {
            SubmitMessageRequest req = SubmitMessageRequest.customerMessage(SESSION_ID, "Test");
            assertEquals(SESSION_ID, req.getSessionId());
            assertEquals(MessageSenderType.CUSTOMER, req.getSenderType());
            assertEquals("Test", req.getContent());
            assertNull(req.getIntentType());
            assertFalse(req.isEscalationFlag());
        }

        @Test
        void aiMessageFactoryProducesFullyPopulatedRequest() {
            SubmitMessageRequest req = SubmitMessageRequest.aiMessage(
                    SESSION_ID, "Response", IntentType.FAQ, ConfidenceLevel.MEDIUM, 0.65, 500L, true);

            assertEquals(MessageSenderType.AI, req.getSenderType());
            assertEquals(IntentType.FAQ, req.getIntentType());
            assertEquals(ConfidenceLevel.MEDIUM, req.getConfidenceLevel());
            assertEquals(0.65, req.getConfidenceScore());
            assertEquals(500L, req.getResponseLatencyMs());
            assertTrue(req.isEscalationFlag());
        }
    }

    // -----------------------------------------------------------------------
    // Redis unavailable (no cache repo wired)
    // -----------------------------------------------------------------------

    @Nested
    class RedisUnavailable {

        private ChatSessionService noRedisService;

        @BeforeEach
        void setUp() {
            // Create service WITHOUT wiring the cache repo (simulates disabled Redis)
            noRedisService = new ChatSessionService(sessionRepository, messageRepository);
        }

        @Test
        void createSessionWorksWithoutRedis() {
            when(sessionRepository.save(any())).thenReturn(openSessionDoc(SESSION_ID, CUSTOMER_ID));

            ChatSession result = noRedisService.createSession(customerContext(), Map.of());

            assertNotNull(result);
            // Ensure the cache repo was never called
            verifyNoInteractions(sessionCacheRepository);
        }

        @Test
        void resumeSessionFallsBackToMongoWhenNoCacheRepo() {
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(openSessionDoc(SESSION_ID, CUSTOMER_ID)));

            ChatSession result = noRedisService.resumeSession(SESSION_ID, CUSTOMER_ID);

            assertEquals(SESSION_ID, result.getId());
            verifyNoInteractions(sessionCacheRepository);
        }

        @Test
        void closeSessionEvictsNothingWhenNoCacheRepo() {
            when(sessionRepository.findByIdAndCustomerId(SESSION_ID, CUSTOMER_ID))
                    .thenReturn(Optional.of(activeSessionDoc(SESSION_ID, CUSTOMER_ID)));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> noRedisService.closeSession(SESSION_ID, CUSTOMER_ID));
            verifyNoInteractions(sessionCacheRepository);
        }
    }
}
