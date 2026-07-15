package com.company.chatbot.knowledge;

import com.company.chatbot.common.enums.KnowledgeSourceType;

import java.time.Instant;

public record KnowledgeDocumentIngestedEvent(
        String eventType,
        Long documentId,
        int version,
        KnowledgeSourceType sourceType,
        String jobId,
        Instant occurredAt
) {
}
