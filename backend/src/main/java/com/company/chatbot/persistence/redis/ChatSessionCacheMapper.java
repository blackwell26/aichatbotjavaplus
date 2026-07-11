package com.company.chatbot.persistence.redis;

import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.persistence.redis.model.ChatSessionCacheEntry;

public final class ChatSessionCacheMapper {

    private ChatSessionCacheMapper() {}

    public static ChatSessionCacheEntry toCacheEntry(ChatSession session) {
        if (session == null) {
            return null;
        }
        ChatSessionCacheEntry entry = new ChatSessionCacheEntry();
        entry.setSessionId(session.getId());
        entry.setCustomerId(session.getCustomerId());
        entry.setStatus(session.getStatus() != null ? session.getStatus().name() : null);
        entry.setChannel(session.getChannel());
        entry.setEscalationId(session.getEscalationId());
        entry.setCreatedAt(session.getCreatedAt());
        entry.setUpdatedAt(session.getUpdatedAt());
        entry.setMetadata(session.getMetadata());
        return entry;
    }

    public static ChatSession toDomain(ChatSessionCacheEntry entry) {
        if (entry == null) {
            return null;
        }
        ChatSessionStatus status = parseStatus(entry.getStatus());
        return new ChatSession(
                entry.getSessionId(),
                entry.getCustomerId(),
                status,
                entry.getChannel(),
                entry.getEscalationId(),
                entry.getCreatedAt(),
                entry.getUpdatedAt(),
                null,
                entry.getMetadata()
        );
    }

    private static ChatSessionStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return ChatSessionStatus.OPEN;
        }
        try {
            return ChatSessionStatus.valueOf(status);
        } catch (IllegalArgumentException ex) {
            return ChatSessionStatus.OPEN;
        }
    }
}
