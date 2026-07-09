package com.company.chatbot.persistence.mongo;

import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.common.enums.ChatSessionStatus;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ChatSessionMapperTest {

    @Test
    void roundTripsDomainAndDocument() {
        Instant now = Instant.parse("2026-07-09T12:00:00Z");
        ChatSession session = new ChatSession(
                "session-1",
                "customer-1",
                ChatSessionStatus.ACTIVE,
                "web",
                "esc-1",
                now,
                now,
                null,
                Map.of("source", "test")
        );

        ChatSessionDocument document = ChatSessionMapper.toDocument(session);
        ChatSession restored = ChatSessionMapper.toDomain(document);

        assertNotNull(restored);
        assertEquals(session.getId(), restored.getId());
        assertEquals(session.getCustomerId(), restored.getCustomerId());
        assertEquals(session.getStatus(), restored.getStatus());
        assertEquals(session.getChannel(), restored.getChannel());
        assertEquals("test", restored.getMetadata().get("source"));
    }
}
