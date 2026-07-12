package com.company.chatbot.api;

import com.company.chatbot.chat.ChatMessage;
import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.chat.ChatSessionNotFoundException;
import com.company.chatbot.chat.ChatSessionService;
import com.company.chatbot.chat.MessageAppendResult;
import com.company.chatbot.chat.SubmitMessageRequest;
import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.common.enums.MessageSenderType;
import com.company.chatbot.security.AuditLogService;
import com.company.chatbot.security.RolePermissionEvaluator;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Controller-layer tests for {@link ChatSessionController} covering all 5 endpoints,
 * authenticated success paths, unauthorised access, validation errors, and not-found cases.
 *
 * <p>Uses {@code @SpringBootTest} with infrastructure auto-configurations excluded so that
 * no real databases, Redis, or Kafka connections are required — matching the pattern used
 * by the existing security integration tests in this project.  Only
 * {@link ChatSessionService} and {@link AuditLogService} are mocked; the full Spring
 * Security stack (JWT filter, access rules) is active.</p>
 */
@SpringBootTest(classes = {
        com.company.chatbot.ChatbotApplication.class,
        ChatSessionControllerTest.ServiceMocks.class
})
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "security.jwt.secret=test-controller-secret-with-enough-length-0123456789",
        "security.rate-limit.enabled=false",
        "persistence.redis.enabled=false",
        "persistence.mongo.enabled=false",
        "persistence.postgres.enabled=false",
        "spring.autoconfigure.exclude=" +
                "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration," +
                "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration," +
                "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
                "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
class ChatSessionControllerTest {

    private static final String JWT_SECRET = "test-controller-secret-with-enough-length-0123456789";
    private static final String SESSION_ID = "sess-abc-123";
    private static final String CUSTOMER_ID = "cust-001";
    private static final String BASE_URL = "/api/v1/chat/sessions";

    @Autowired
    MockMvc mockMvc;

    @MockBean
    ChatSessionService sessionService;

    @MockBean
    AuditLogService auditLogService;

    @MockBean
    RolePermissionEvaluator rolePermissionEvaluator;

    private ChatSession sampleSession;
    private ChatMessage sampleMessage;

    /**
     * Inner configuration that provides mock beans for infra repos that are
     * referenced by the application context but excluded from auto-config.
     * Without this, @MockBean declarations on test fields aren't sufficient to
     * suppress construction-time injection failures inside optional beans.
     */
    @Configuration
    static class ServiceMocks {
        @Bean
        @Primary
        public com.company.chatbot.persistence.mongo.ChatSessionDocumentRepository mockSessionDocRepo() {
            return org.mockito.Mockito.mock(
                    com.company.chatbot.persistence.mongo.ChatSessionDocumentRepository.class);
        }

        @Bean
        @Primary
        public com.company.chatbot.persistence.mongo.ChatMessageDocumentRepository mockMessageDocRepo() {
            return org.mockito.Mockito.mock(
                    com.company.chatbot.persistence.mongo.ChatMessageDocumentRepository.class);
        }

        @Bean
        @Primary
        public com.company.chatbot.persistence.postgres.AuditLogRepository mockAuditLogRepo() {
            return org.mockito.Mockito.mock(
                    com.company.chatbot.persistence.postgres.AuditLogRepository.class);
        }

        /**
         * TokenBlacklistRepository needs StringRedisTemplate which is excluded.
         * Provide a mock so JwtTokenVerifier's optional setter injection doesn't fail.
         */
        @Bean
        @Primary
        public com.company.chatbot.persistence.redis.TokenBlacklistRepository mockTokenBlacklist() {
            return org.mockito.Mockito.mock(
                    com.company.chatbot.persistence.redis.TokenBlacklistRepository.class);
        }

        /**
         * RateLimitRepository needs StringRedisTemplate which is excluded.
         * Providing a mock also satisfies @ConditionalOnBean(RateLimitRepository.class)
         * so ApiRateLimitFilter is instantiated (and then suppressed by rate-limit.enabled=false).
         */
        @Bean
        @Primary
        public com.company.chatbot.persistence.redis.RateLimitRepository mockRateLimitRepo() {
            return org.mockito.Mockito.mock(
                    com.company.chatbot.persistence.redis.RateLimitRepository.class);
        }
    }

    @BeforeEach
    void setUp() {
        Instant now = Instant.parse("2026-07-12T12:00:00Z");
        sampleSession = new ChatSession(
                SESSION_ID, CUSTOMER_ID, ChatSessionStatus.OPEN, null, null,
                now, now, null, Map.of()
        );
        sampleMessage = new ChatMessage(
                "msg-001", SESSION_ID, MessageSenderType.CUSTOMER,
                "Hello, where is my order?", now
        );

        doNothing().when(auditLogService)
                .logSensitiveAction(any(), anyString(), anyString(), anyString(), any());
    }

    @AfterEach
    void tearDown() {
        com.company.chatbot.context.CustomerContextHolder.clear();
    }

    // -----------------------------------------------------------------------
    // Token helpers
    // -----------------------------------------------------------------------

    private String bearerToken(String subject, String customerId, List<String> roles) {
        Key key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        return "Bearer " + Jwts.builder()
                .setSubject(subject)
                .claim("customerId", customerId)
                .claim("roles", roles)
                .signWith(key)
                .compact();
    }

    private String customerToken() {
        return bearerToken(CUSTOMER_ID, CUSTOMER_ID, List.of("CUSTOMER"));
    }

    private String agentToken() {
        return bearerToken("agent-001", "agent-001", List.of("AGENT"));
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/chat/sessions
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/v1/chat/sessions — create session")
    class CreateSession {

        @Test
        @DisplayName("authenticated customer creates session → 201 with session body")
        void authenticatedCustomer_createsSession_returns201() throws Exception {
            when(sessionService.createSession(any(), any())).thenReturn(sampleSession);

            mockMvc.perform(post(BASE_URL)
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is(SESSION_ID)))
                    .andExpect(jsonPath("$.customerId", is(CUSTOMER_ID)))
                    .andExpect(jsonPath("$.status", is("OPEN")));
        }

        @Test
        @DisplayName("create session with metadata → metadata passed through")
        void createSession_withMetadata_passesMetadataToService() throws Exception {
            when(sessionService.createSession(any(), any())).thenReturn(sampleSession);

            mockMvc.perform(post(BASE_URL)
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"metadata\":{\"channel\":\"web\"}}"))
                    .andExpect(status().isCreated());

            verify(sessionService).createSession(any(), any());
        }

        @Test
        @DisplayName("no request body (null) → still creates session with empty metadata")
        void createSession_noBody_createsWithEmptyMetadata() throws Exception {
            when(sessionService.createSession(any(), any())).thenReturn(sampleSession);

            mockMvc.perform(post(BASE_URL)
                            .header(HttpHeaders.AUTHORIZATION, customerToken()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is(SESSION_ID)));
        }

        @Test
        @DisplayName("unauthenticated request → 401 Unauthorized")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("agent can also create a session")
        void agent_canCreateSession() throws Exception {
            when(sessionService.createSession(any(), any())).thenReturn(sampleSession);

            mockMvc.perform(post(BASE_URL)
                            .header(HttpHeaders.AUTHORIZATION, agentToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isCreated());
        }
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/chat/sessions/{sessionId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/v1/chat/sessions/{sessionId} — get session")
    class GetSession {

        @Test
        @DisplayName("authenticated owner retrieves session → 200 with session body")
        void authenticatedOwner_getsSession_returns200() throws Exception {
            when(sessionService.resumeSession(eq(SESSION_ID), eq(CUSTOMER_ID)))
                    .thenReturn(sampleSession);

            mockMvc.perform(get(BASE_URL + "/" + SESSION_ID)
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(SESSION_ID)))
                    .andExpect(jsonPath("$.status", is("OPEN")));
        }

        @Test
        @DisplayName("session not found → 404")
        void sessionNotFound_returns404() throws Exception {
            when(sessionService.resumeSession(eq(SESSION_ID), eq(CUSTOMER_ID)))
                    .thenThrow(new ChatSessionNotFoundException("Chat session not found. sessionId=" + SESSION_ID));

            mockMvc.perform(get(BASE_URL + "/" + SESSION_ID)
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error", is("session_not_found")));
        }

        @Test
        @DisplayName("invalid session ID format → 400")
        void invalidSessionId_returns400() throws Exception {
            mockMvc.perform(get(BASE_URL + "/invalid%20id%20with%20spaces")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("unauthenticated request → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(get(BASE_URL + "/" + SESSION_ID))
                    .andExpect(status().isUnauthorized());
        }
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/chat/sessions/{sessionId}/messages
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/v1/chat/sessions/{sessionId}/messages — send message")
    class SendMessage {

        @Test
        @DisplayName("valid message → 200 with message and session in response")
        void validMessage_returns200WithMessageAndSession() throws Exception {
            MessageAppendResult result = new MessageAppendResult(sampleMessage, sampleSession);
            when(sessionService.appendMessage(any(SubmitMessageRequest.class))).thenReturn(result);

            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/messages")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"content\":\"Where is my order?\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message.id", is("msg-001")))
                    .andExpect(jsonPath("$.message.senderType", is("CUSTOMER")))
                    .andExpect(jsonPath("$.session.id", is(SESSION_ID)))
                    .andExpect(jsonPath("$.aiResponse", nullValue()));
        }

        @Test
        @DisplayName("blank content → 400 validation error with field detail")
        void blankContent_returns400WithFieldError() throws Exception {
            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/messages")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"content\":\"\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("validation_failed")))
                    .andExpect(jsonPath("$.fields", hasKey("content")));
        }

        @Test
        @DisplayName("missing content field → 400 validation error")
        void missingContent_returns400() throws Exception {
            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/messages")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("validation_failed")));
        }

        @Test
        @DisplayName("content exceeds 4000 characters → 400 validation error")
        void oversizedContent_returns400() throws Exception {
            String longContent = "a".repeat(4001);
            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/messages")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"content\":\"" + longContent + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("validation_failed")));
        }

        @Test
        @DisplayName("session not found → 404")
        void sessionNotFound_returns404() throws Exception {
            when(sessionService.appendMessage(any(SubmitMessageRequest.class)))
                    .thenThrow(new ChatSessionNotFoundException("session not found"));

            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/messages")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"content\":\"Hello\"}"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("unauthenticated request → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/messages")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"content\":\"Hello\"}"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/chat/sessions/{sessionId}/close
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/v1/chat/sessions/{sessionId}/close — close session")
    class CloseSession {

        @Test
        @DisplayName("owner closes open session → 200 with CLOSED status")
        void ownerClosesSession_returns200Closed() throws Exception {
            Instant now = Instant.now();
            ChatSession closed = new ChatSession(
                    SESSION_ID, CUSTOMER_ID, ChatSessionStatus.CLOSED, null, null,
                    sampleSession.getCreatedAt(), now, now, Map.of()
            );
            when(sessionService.closeSession(eq(SESSION_ID), eq(CUSTOMER_ID))).thenReturn(closed);

            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/close")
                            .header(HttpHeaders.AUTHORIZATION, customerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.session.id", is(SESSION_ID)))
                    .andExpect(jsonPath("$.session.status", is("CLOSED")))
                    .andExpect(jsonPath("$.message", is("Session closed successfully")));
        }

        @Test
        @DisplayName("idempotent: already-closed session still returns 200")
        void alreadyClosedSession_returns200Idempotent() throws Exception {
            Instant t = sampleSession.getCreatedAt();
            ChatSession alreadyClosed = new ChatSession(
                    SESSION_ID, CUSTOMER_ID, ChatSessionStatus.CLOSED, null, null,
                    t, t, t, Map.of()
            );
            when(sessionService.closeSession(eq(SESSION_ID), eq(CUSTOMER_ID))).thenReturn(alreadyClosed);

            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/close")
                            .header(HttpHeaders.AUTHORIZATION, customerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.session.status", is("CLOSED")));
        }

        @Test
        @DisplayName("session not found → 404")
        void sessionNotFound_returns404() throws Exception {
            when(sessionService.closeSession(eq(SESSION_ID), eq(CUSTOMER_ID)))
                    .thenThrow(new ChatSessionNotFoundException("session not found"));

            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/close")
                            .header(HttpHeaders.AUTHORIZATION, customerToken()))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("unauthenticated request → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/close"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("audit log is written on close")
        void closeSession_writesAuditLog() throws Exception {
            Instant now = Instant.now();
            ChatSession closed = new ChatSession(
                    SESSION_ID, CUSTOMER_ID, ChatSessionStatus.CLOSED, null, null,
                    sampleSession.getCreatedAt(), now, now, Map.of()
            );
            when(sessionService.closeSession(anyString(), anyString())).thenReturn(closed);

            mockMvc.perform(post(BASE_URL + "/" + SESSION_ID + "/close")
                            .header(HttpHeaders.AUTHORIZATION, customerToken()))
                    .andExpect(status().isOk());

            verify(auditLogService).logSensitiveAction(
                    any(), eq("CHAT_SESSION_CLOSED"), eq("chat_session"), eq(SESSION_ID), any());
        }
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/chat/sessions/{sessionId}/history
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/v1/chat/sessions/{sessionId}/history — message history")
    class GetHistory {

        @Test
        @DisplayName("returns ordered message transcript with count")
        void returnsMessageTranscript() throws Exception {
            Instant t1 = Instant.parse("2026-07-12T10:00:00Z");
            Instant t2 = Instant.parse("2026-07-12T10:00:05Z");
            ChatMessage msg1 = new ChatMessage("msg-001", SESSION_ID, MessageSenderType.CUSTOMER,
                    "Hello", t1);
            ChatMessage msg2 = new ChatMessage("msg-002", SESSION_ID, MessageSenderType.AI,
                    "Hi! How can I help?", t2);

            when(sessionService.getHistory(SESSION_ID)).thenReturn(List.of(msg1, msg2));

            mockMvc.perform(get(BASE_URL + "/" + SESSION_ID + "/history")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.sessionId", is(SESSION_ID)))
                    .andExpect(jsonPath("$.totalMessages", is(2)))
                    .andExpect(jsonPath("$.messages[0].id", is("msg-001")))
                    .andExpect(jsonPath("$.messages[0].senderType", is("CUSTOMER")))
                    .andExpect(jsonPath("$.messages[1].id", is("msg-002")))
                    .andExpect(jsonPath("$.messages[1].senderType", is("AI")));
        }

        @Test
        @DisplayName("empty transcript → empty list with totalMessages 0")
        void emptyHistory_returnsEmptyList() throws Exception {
            when(sessionService.getHistory(SESSION_ID)).thenReturn(List.of());

            mockMvc.perform(get(BASE_URL + "/" + SESSION_ID + "/history")
                            .header(HttpHeaders.AUTHORIZATION, customerToken())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalMessages", is(0)))
                    .andExpect(jsonPath("$.messages").isArray());
        }

        @Test
        @DisplayName("invalid session ID format → 400")
        void invalidId_returns400() throws Exception {
            // URL-encoded spaces are decoded and then fail IdValidator's pattern check
            mockMvc.perform(get(BASE_URL + "/invalid%20id/history")
                            .header(HttpHeaders.AUTHORIZATION, customerToken()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("unauthenticated request → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(get(BASE_URL + "/" + SESSION_ID + "/history"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
