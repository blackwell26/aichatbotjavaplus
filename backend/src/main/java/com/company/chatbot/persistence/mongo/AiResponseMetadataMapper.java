package com.company.chatbot.persistence.mongo;

import com.company.chatbot.chat.AiResponseMetadata;
import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;

public final class AiResponseMetadataMapper {

    private AiResponseMetadataMapper() {}

    public static AiResponseMetadata toDomain(AiResponseMetadataDocument document) {
        if (document == null) {
            return null;
        }
        return new AiResponseMetadata(
                document.getId(),
                document.getSessionId(),
                document.getMessageId(),
                document.getResponseText(),
                parseIntentType(document.getIntentType()),
                parseConfidenceLevel(document.getConfidenceLevel()),
                document.getConfidenceScore(),
                document.getModelName(),
                document.getPromptSize(),
                document.getCompletionLatencyMs(),
                document.getFailureReason(),
                document.getCitations(),
                document.isEscalationRecommended(),
                document.getCreatedAt(),
                document.getMetadata()
        );
    }

    public static AiResponseMetadataDocument toDocument(AiResponseMetadata metadata) {
        if (metadata == null) {
            return null;
        }
        AiResponseMetadataDocument document = new AiResponseMetadataDocument();
        document.setId(metadata.getId());
        document.setSessionId(metadata.getSessionId());
        document.setMessageId(metadata.getMessageId());
        document.setResponseText(metadata.getResponseText());
        document.setIntentType(metadata.getIntentType() != null ? metadata.getIntentType().name() : null);
        document.setConfidenceLevel(metadata.getConfidenceLevel() != null ? metadata.getConfidenceLevel().name() : null);
        document.setConfidenceScore(metadata.getConfidenceScore());
        document.setModelName(metadata.getModelName());
        document.setPromptSize(metadata.getPromptSize());
        document.setCompletionLatencyMs(metadata.getCompletionLatencyMs());
        document.setFailureReason(metadata.getFailureReason());
        document.setCitations(metadata.getCitations());
        document.setEscalationRecommended(metadata.isEscalationRecommended());
        document.setCreatedAt(metadata.getCreatedAt());
        document.setMetadata(metadata.getMetadata());
        return document;
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
