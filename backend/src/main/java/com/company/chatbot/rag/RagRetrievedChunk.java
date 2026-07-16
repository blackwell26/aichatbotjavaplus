package com.company.chatbot.rag;

public record RagRetrievedChunk(
        Long documentId,
        Long chunkId,
        int sequence,
        String content,
        RagCitation citation
) {
}
