package com.company.chatbot.rag;

import com.company.chatbot.common.enums.KnowledgeSourceType;

public record RagCitation(
        Long documentId,
        Long chunkId,
        String sourceTitle,
        KnowledgeSourceType sourceType,
        int version,
        double similarity
) {
}
