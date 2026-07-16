package com.company.chatbot.rag;

import java.util.List;

public record RagPromptContext(
        String queryHash,
        String prompt,
        List<RagRetrievedChunk> chunks,
        List<RagCitation> citations,
        boolean cacheHit,
        boolean noResults,
        String fallbackReason
) {
}
