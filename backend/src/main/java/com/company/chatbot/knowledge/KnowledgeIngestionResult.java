package com.company.chatbot.knowledge;

public record KnowledgeIngestionResult(
        KnowledgeIngestionJob job,
        KnowledgeDocumentDetail document
) {
}
