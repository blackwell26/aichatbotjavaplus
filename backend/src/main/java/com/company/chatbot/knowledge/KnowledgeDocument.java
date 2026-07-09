package com.company.chatbot.knowledge;

import com.company.chatbot.common.enums.KnowledgeSourceType;

import java.time.Instant;

/**
 * Metadata for an ingested knowledge base document.
 */
public class KnowledgeDocument {

    private Long id;
    private String title;
    private KnowledgeSourceType sourceType;
    private String source;
    private int version;
    private String status;
    private String uploadedBy;
    private Instant createdAt;
    private Instant updatedAt;

    public KnowledgeDocument() {}

    public KnowledgeDocument(Long id, String title, KnowledgeSourceType sourceType, String source, int version,
                             String status, String uploadedBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.title = title;
        this.sourceType = sourceType;
        this.source = source;
        this.version = version;
        this.status = status;
        this.uploadedBy = uploadedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public KnowledgeSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(KnowledgeSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
