package com.company.chatbot.knowledge;

import com.company.chatbot.common.enums.KnowledgeSourceType;

import java.time.Instant;

public record KnowledgeDocumentSummary(
        Long id,
        String title,
        KnowledgeSourceType sourceType,
        String source,
        int version,
        String status,
        String uploadedBy,
        Instant createdAt,
        Instant updatedAt
) {
}
