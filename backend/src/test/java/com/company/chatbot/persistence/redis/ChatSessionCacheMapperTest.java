package com.company.chatbot.persistence.redis;

import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.persistence.redis.model.ChatSessionCacheEntry;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ChatSessionCacheMapperTest {

    @Test
    void mapsBetweenDomainSessionAndCacheEntry() {
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

        ChatSessionCacheEntry entry = ChatSessionCacheMapper.toCacheEntry(session);
        ChatSession mapped = ChatSessionCacheMapper.toDomain(entry);

        assertEquals("session-1", entry.getSessionId());
        assertEquals("customer-1", mapped.getCustomerId());
        assertEquals(ChatSessionStatus.OPEN, mapped.getStatus());
        assertEquals("web", mapped.getChannel());
        assertEquals("en-US", mapped.getMetadata().get("locale"));
        assertNull(mapped.getClosedAt());
    }
}
