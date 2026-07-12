package com.company.chatbot.api.dto;

import com.company.chatbot.chat.ChatMessage;
import com.company.chatbot.chat.ChatSession;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Stateless mapper between chat domain objects and their API DTO counterparts.
 */
public final class ChatDtoMapper {

    private ChatDtoMapper() {}

    public static ChatSessionDto toDto(ChatSession session) {
        if (session == null) {
            return null;
        }
        return new ChatSessionDto(
                session.getId(),
                session.getCustomerId(),
                session.getStatus() != null ? session.getStatus().name() : null,
                session.getChannel(),
                session.getEscalationId(),
                session.getCreatedAt(),
                session.getUpdatedAt(),
                session.getClosedAt(),
                session.getMetadata()
        );
    }

    public static ChatMessageDto toDto(ChatMessage message) {
        if (message == null) {
            return null;
        }
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(message.getId());
        dto.setSessionId(message.getSessionId());
        dto.setSenderType(message.getSenderType() != null ? message.getSenderType().name() : null);
        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        dto.setIntentType(message.getIntentType() != null ? message.getIntentType().name() : null);
        dto.setConfidenceLevel(message.getConfidenceLevel() != null ? message.getConfidenceLevel().name() : null);
        dto.setConfidenceScore(message.getConfidenceScore());
        dto.setResponseLatencyMs(message.getResponseLatencyMs());
        dto.setEscalationFlag(message.isEscalationFlag());
        dto.setMetadata(message.getMetadata());
        return dto;
    }

    public static List<ChatMessageDto> toDtoList(List<ChatMessage> messages) {
        if (messages == null) {
            return List.of();
        }
        return messages.stream()
                .map(ChatDtoMapper::toDto)
                .collect(Collectors.toList());
    }
}
