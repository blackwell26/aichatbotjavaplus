package com.company.chatbot.persistence.mongo;

import com.company.chatbot.chat.ChatMessage;
import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.MessageSenderType;

public final class ChatMessageMapper {

    private ChatMessageMapper() {}

    public static ChatMessage toDomain(ChatMessageDocument document) {
        if (document == null) {
            return null;
        }
        return new ChatMessage(
                document.getId(),
                document.getSessionId(),
                parseSenderType(document.getSenderType()),
                document.getContent(),
                document.getTimestamp(),
                parseIntentType(document.getIntentType()),
                parseConfidenceLevel(document.getConfidenceLevel()),
                document.getConfidenceScore(),
                document.getResponseLatencyMs(),
                document.isEscalationFlag(),
                document.getMetadata()
        );
    }

    public static ChatMessageDocument toDocument(ChatMessage message) {
        if (message == null) {
            return null;
        }
        ChatMessageDocument document = new ChatMessageDocument();
        document.setId(message.getId());
        document.setSessionId(message.getSessionId());
        document.setSenderType(message.getSenderType() != null ? message.getSenderType().name() : null);
        document.setContent(message.getContent());
        document.setTimestamp(message.getTimestamp());
        document.setIntentType(message.getIntentType() != null ? message.getIntentType().name() : null);
        document.setConfidenceLevel(message.getConfidenceLevel() != null ? message.getConfidenceLevel().name() : null);
        document.setConfidenceScore(message.getConfidenceScore());
        document.setResponseLatencyMs(message.getResponseLatencyMs());
        document.setEscalationFlag(message.isEscalationFlag());
        document.setMetadata(message.getMetadata());
        return document;
    }

    private static MessageSenderType parseSenderType(String senderType) {
        if (senderType == null || senderType.isBlank()) {
            return null;
        }
        try {
            return MessageSenderType.valueOf(senderType);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static IntentType parseIntentType(String intentType) {
        if (intentType == null || intentType.isBlank()) {
            return null;
        }
        try {
            return IntentType.valueOf(intentType);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static ConfidenceLevel parseConfidenceLevel(String confidenceLevel) {
        if (confidenceLevel == null || confidenceLevel.isBlank()) {
            return null;
        }
        try {
            return ConfidenceLevel.valueOf(confidenceLevel);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
