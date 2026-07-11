package com.company.chatbot.persistence.redis;

import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.config.RedisCacheProperties;
import com.company.chatbot.config.RedisConfig;
import com.company.chatbot.persistence.postgres.support.DockerConditions;
import com.company.chatbot.persistence.redis.model.ChatContextEntry;
import com.company.chatbot.persistence.redis.model.RagQueryCacheEntry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.redis.DataRedisTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataRedisTest
@Import({RedisConfig.class, RedisCacheProperties.class})
@Testcontainers
@TestPropertySource(properties = {
        "persistence.redis.enabled=true",
        "persistence.postgres.enabled=false",
        "persistence.mongo.enabled=false",
        "persistence.redis.ttl.chat-session=2s",
        "persistence.redis.ttl.chat-context=2s",
        "persistence.redis.ttl.rag-query-cache=2s",
        "persistence.redis.ttl.token-blacklist=2s",
        "persistence.redis.ttl.rate-limit=2s"
})
@EnabledIf("com.company.chatbot.persistence.postgres.support.DockerConditions#dockerAvailable")
class RedisRepositoryIntegrationTest {

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureRedis(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }

    @Autowired
    private ChatSessionCacheRepository chatSessionCacheRepository;

    @Autowired
    private ChatContextRepository chatContextRepository;

    @Autowired
    private RagQueryCacheRepository ragQueryCacheRepository;

    @Autowired
    private TokenBlacklistRepository tokenBlacklistRepository;

    @Autowired
    private RateLimitRepository rateLimitRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Test
    void storesAndRetrievesAllRedisKeyTypesWithConfiguredTtl() throws InterruptedException {
        Instant now = Instant.parse("2026-07-10T12:00:00Z");

        ChatSession session = new ChatSession(
                "session-1",
                "customer-1",
                ChatSessionStatus.OPEN,
                "web",
                null,
                now,
                now,
                null,
                Map.of("locale", "en-US")
        );
        chatSessionCacheRepository.save(ChatSessionCacheMapper.toCacheEntry(session));
        assertTrue(chatSessionCacheRepository.findBySessionId("session-1").isPresent());
        assertTrue(redisTemplate.hasKey(RedisKeyStrategy.chatSession("session-1")));

        ChatContextEntry context = new ChatContextEntry();
        context.setSessionId("session-1");
        context.setCustomerId("customer-1");
        context.setCurrentIntent("ORDER_STATUS");
        context.setRecentMessageIds(List.of("msg-1", "msg-2"));
        context.setRagContextSummary("Order #12345 is in transit.");
        context.setUpdatedAt(now);
        chatContextRepository.save(context);
        assertTrue(chatContextRepository.findBySessionId("session-1").isPresent());

        RagQueryCacheEntry ragEntry = new RagQueryCacheEntry();
        ragEntry.setQueryHash("hash-1");
        ragEntry.setQueryText("What is your return policy?");
        ragEntry.setCitations(List.of(Map.of(
                "documentId", 10,
                "chunkId", 42,
                "sourceTitle", "Return Policy"
        )));
        ragEntry.setCachedAt(now);
        ragQueryCacheRepository.save(ragEntry);
        assertTrue(ragQueryCacheRepository.findByQueryHash("hash-1").isPresent());

        tokenBlacklistRepository.blacklist("token-1", Duration.ofSeconds(2));
        assertTrue(tokenBlacklistRepository.isBlacklisted("token-1"));

        assertEquals(1L, rateLimitRepository.incrementAndGet("customer-1"));
        assertEquals(2L, rateLimitRepository.incrementAndGet("customer-1"));
        assertEquals(2L, rateLimitRepository.getCount("customer-1"));

        Thread.sleep(2500L);

        assertFalse(chatSessionCacheRepository.findBySessionId("session-1").isPresent());
        assertFalse(chatContextRepository.findBySessionId("session-1").isPresent());
        assertFalse(ragQueryCacheRepository.findByQueryHash("hash-1").isPresent());
        assertFalse(tokenBlacklistRepository.isBlacklisted("token-1"));
    }
}
