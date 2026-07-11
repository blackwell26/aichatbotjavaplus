package com.company.chatbot.chat;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Structured metadata captured for an AI-generated chat response.
 */
public class AiResponseMetadata {

    private String id;
    private String sessionId;
    private String messageId;
    private String responseText;
    private IntentType intentType;
    private ConfidenceLevel confidenceLevel;
    private Double confidenceScore;
    private String modelName;
    private Integer promptSize;
    private Long completionLatencyMs;
    private String failureReason;
    private List<Map<String, Object>> citations;
    private boolean escalationRecommended;
    private Instant createdAt;
    private Map<String, Object> metadata;

    public AiResponseMetadata() {}

    public AiResponseMetadata(String id, String sessionId, String messageId, String responseText,
                              IntentType intentType, ConfidenceLevel confidenceLevel, Double confidenceScore,
                              String modelName, Integer promptSize, Long completionLatencyMs, String failureReason,
                              List<Map<String, Object>> citations, boolean escalationRecommended, Instant createdAt,
                              Map<String, Object> metadata) {
        this.id = id;
        this.sessionId = sessionId;
        this.messageId = messageId;
        this.responseText = responseText;
        this.intentType = intentType;
        this.confidenceLevel = confidenceLevel;
        this.confidenceScore = confidenceScore;
        this.modelName = modelName;
        this.promptSize = promptSize;
        this.completionLatencyMs = completionLatencyMs;
        this.failureReason = failureReason;
        this.citations = citations;
        this.escalationRecommended = escalationRecommended;
        this.createdAt = createdAt;
        this.metadata = metadata;
    }

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

    public IntentType getIntentType() {
        return intentType;
    }

    public void setIntentType(IntentType intentType) {
        this.intentType = intentType;
    }

    public ConfidenceLevel getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(ConfidenceLevel confidenceLevel) {
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
        return citations == null ? Collections.emptyList() : citations;
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
        return metadata == null ? Collections.emptyMap() : metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
