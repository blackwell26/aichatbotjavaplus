package com.company.chatbot.persistence.mongo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "ai_response_metadata")
public class AiResponseMetadataDocument {

    @Id
    private String id;

    @Indexed
    private String sessionId;

    @Indexed
    private String messageId;

    private String responseText;
    private String intentType;
    private String confidenceLevel;
    private Double confidenceScore;
    private String modelName;
    private Integer promptSize;
    private Long completionLatencyMs;
    private String failureReason;
    private List<Map<String, Object>> citations;
    private boolean escalationRecommended;

    @Indexed
    private Instant createdAt;

    private Map<String, Object> metadata;

    public AiResponseMetadataDocument() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public String getIntentType() {
        return intentType;
    }

    public void setIntentType(String intentType) {
        this.intentType = intentType;
    }

    public String getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(String confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public Integer getPromptSize() {
        return promptSize;
    }

    public void setPromptSize(Integer promptSize) {
        this.promptSize = promptSize;
    }

    public Long getCompletionLatencyMs() {
        return completionLatencyMs;
    }

    public void setCompletionLatencyMs(Long completionLatencyMs) {
        this.completionLatencyMs = completionLatencyMs;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public List<Map<String, Object>> getCitations() {
        return citations;
    }

    public void setCitations(List<Map<String, Object>> citations) {
        this.citations = citations;
    }

    public boolean isEscalationRecommended() {
        return escalationRecommended;
    }

    public void setEscalationRecommended(boolean escalationRecommended) {
        this.escalationRecommended = escalationRecommended;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
