package com.company.chatbot.persistence.redis;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RedisKeyStrategyTest {

    @Test
    void buildsCanonicalKeyPatterns() {
        assertEquals("chat:session:session-1", RedisKeyStrategy.chatSession("session-1"));
        assertEquals("chat:context:session-1", RedisKeyStrategy.chatContext("session-1"));
        assertEquals("rag:query-cache:abc123", RedisKeyStrategy.ragQueryCache("abc123"));
        assertEquals("auth:token-blacklist:token-1", RedisKeyStrategy.tokenBlacklist("token-1"));
        assertEquals("rate-limit:customer-1", RedisKeyStrategy.rateLimit("customer-1"));
    }

    @Test
    void rejectsBlankIdentifiers() {
        assertThrows(IllegalArgumentException.class, () -> RedisKeyStrategy.chatSession(" "));
        assertThrows(IllegalArgumentException.class, () -> RedisKeyStrategy.chatContext(""));
        assertThrows(NullPointerException.class, () -> RedisKeyStrategy.ragQueryCache(null));
    }
}
