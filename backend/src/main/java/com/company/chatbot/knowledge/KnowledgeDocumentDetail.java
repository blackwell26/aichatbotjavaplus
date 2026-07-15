package com.company.chatbot.knowledge;

import java.util.List;

public record KnowledgeDocumentDetail(
        KnowledgeDocumentSummary document,
        List<KnowledgeChunkSummary> chunks,
        int embeddingCount,
        String originalDocumentStorage
) {
}
