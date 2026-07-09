package com.company.chatbot.knowledge;

import com.company.chatbot.common.enums.KnowledgeSourceType;

import java.time.Instant;

/**
 * Reference to a stored vector embedding for a knowledge chunk.
 */
public class EmbeddingReference {

    private Long id;
    private String embeddingId;
    private Long documentId;
    private Long chunkId;
    private String sourceTitle;
    private KnowledgeSourceType sourceType;
    private int version;
    private int dimension;
    private Instant createdAt;

    public EmbeddingReference() {}

    public EmbeddingReference(Long id, String embeddingId, Long documentId, Long chunkId, String sourceTitle,
                              KnowledgeSourceType sourceType, int version, int dimension, Instant createdAt) {
        this.id = id;
        this.embeddingId = embeddingId;
        this.documentId = documentId;
        this.chunkId = chunkId;
        this.sourceTitle = sourceTitle;
        this.sourceType = sourceType;
        this.version = version;
        this.dimension = dimension;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmbeddingId() {
        return embeddingId;
    }

    public void setEmbeddingId(String embeddingId) {
        this.embeddingId = embeddingId;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Long getChunkId() {
        return chunkId;
    }

    public void setChunkId(Long chunkId) {
        this.chunkId = chunkId;
    }

    public String getSourceTitle() {
        return sourceTitle;
    }

    public void setSourceTitle(String sourceTitle) {
        this.sourceTitle = sourceTitle;
    }

    public KnowledgeSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(KnowledgeSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public int getDimension() {
        return dimension;
    }

    public void setDimension(int dimension) {
        this.dimension = dimension;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
