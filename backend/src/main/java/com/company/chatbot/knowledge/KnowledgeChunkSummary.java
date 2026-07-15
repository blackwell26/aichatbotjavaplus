package com.company.chatbot.knowledge;

public record KnowledgeChunkSummary(
        Long id,
        int sequence,
        String content,
        int tokenCount
) {
}
