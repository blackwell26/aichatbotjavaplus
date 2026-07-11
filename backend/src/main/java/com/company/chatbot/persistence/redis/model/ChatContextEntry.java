package com.company.chatbot.persistence.redis.model;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Short-lived conversation and RAG context for an active chat session.
 */
public class ChatContextEntry {

    private String sessionId;
    private String customerId;
    private String currentIntent;
    private List<String> recentMessageIds;
    private String ragContextSummary;
    private Map<String, Object> attributes;
    private Instant updatedAt;

    public ChatContextEntry() {}

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCurrentIntent() {
        return currentIntent;
    }

    public void setCurrentIntent(String currentIntent) {
        this.currentIntent = currentIntent;
    }

    public List<String> getRecentMessageIds() {
        return recentMessageIds == null ? Collections.emptyList() : recentMessageIds;
    }

    public void setRecentMessageIds(List<String> recentMessageIds) {
        this.recentMessageIds = recentMessageIds;
    }

    public String getRagContextSummary() {
        return ragContextSummary;
    }

    public void setRagContextSummary(String ragContextSummary) {
        this.ragContextSummary = ragContextSummary;
    }

    public Map<String, Object> getAttributes() {
        return attributes == null ? Collections.emptyMap() : attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
