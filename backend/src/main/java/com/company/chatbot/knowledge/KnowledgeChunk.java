package com.company.chatbot.knowledge;

/**
 * Retrieval-friendly segment extracted from a knowledge document.
 */
public class KnowledgeChunk {

    private Long id;
    private Long documentId;
    private int sequence;
    private String content;
    private int tokenCount;

    public KnowledgeChunk() {}

    public KnowledgeChunk(Long id, Long documentId, int sequence, String content, int tokenCount) {
        this.id = id;
        this.documentId = documentId;
        this.sequence = sequence;
        this.content = content;
        this.tokenCount = tokenCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public int getSequence() {
        return sequence;
    }

    public void setSequence(int sequence) {
        this.sequence = sequence;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getTokenCount() {
        return tokenCount;
    }

    public void setTokenCount(int tokenCount) {
        this.tokenCount = tokenCount;
    }
}
