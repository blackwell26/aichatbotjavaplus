package com.company.chatbot.knowledge;

public class KnowledgeIngestionJobNotFoundException extends RuntimeException {
    public KnowledgeIngestionJobNotFoundException(String jobId) {
        super("Knowledge ingestion job not found: " + jobId);
    }
}
