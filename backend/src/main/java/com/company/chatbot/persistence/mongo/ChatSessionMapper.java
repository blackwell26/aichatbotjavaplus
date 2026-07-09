package com.company.chatbot.persistence.mongo;

import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.common.enums.ChatSessionStatus;

public final class ChatSessionMapper {

    private ChatSessionMapper() {}

    public static ChatSession toDomain(ChatSessionDocument document) {
        if (document == null) {
            return null;
        }
        ChatSessionStatus status = parseStatus(document.getStatus());
        return new ChatSession(
                document.getId(),
                document.getCustomerId(),
                status,
                document.getChannel(),
                document.getEscalationId(),
                document.getCreatedAt(),
                document.getUpdatedAt(),
                document.getClosedAt(),
                document.getMetadata()
        );
    }

    public static ChatSessionDocument toDocument(ChatSession session) {
        if (session == null) {
            return null;
        }
        ChatSessionDocument document = new ChatSessionDocument();
        document.setId(session.getId());
        document.setCustomerId(session.getCustomerId());
        document.setStatus(session.getStatus() != null ? session.getStatus().name() : null);
        document.setChannel(session.getChannel());
        document.setEscalationId(session.getEscalationId());
        document.setCreatedAt(session.getCreatedAt());
        document.setUpdatedAt(session.getUpdatedAt());
        document.setClosedAt(session.getClosedAt());
        document.setMetadata(session.getMetadata());
        return document;
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
