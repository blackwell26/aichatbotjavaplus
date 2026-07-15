package com.company.chatbot.knowledge;

import java.time.Instant;

public record KnowledgeIngestionJob(
        String jobId,
        KnowledgeIngestionStatus status,
        Long documentId,
        String message,
        Instant createdAt,
        Instant updatedAt
) {
    public static KnowledgeIngestionJob accepted(String jobId) {
        Instant now = Instant.now();
        return new KnowledgeIngestionJob(jobId, KnowledgeIngestionStatus.ACCEPTED, null,
                "Ingestion accepted", now, now);
    }

    public KnowledgeIngestionJob completed(Long documentId, String message) {
        return new KnowledgeIngestionJob(jobId, KnowledgeIngestionStatus.COMPLETED, documentId,
                message, createdAt, Instant.now());
    }

    public KnowledgeIngestionJob failed(String message) {
        return new KnowledgeIngestionJob(jobId, KnowledgeIngestionStatus.FAILED, documentId,
                message, createdAt, Instant.now());
    }
}
