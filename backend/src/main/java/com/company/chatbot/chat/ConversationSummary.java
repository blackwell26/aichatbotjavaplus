package com.company.chatbot.chat;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Rolling or final summary of a chat session transcript for prompt context and escalation handoff.
 */
public class ConversationSummary {

    private String id;
    private String sessionId;
    private String customerId;
    private String summaryText;
    private int messageCount;
    private List<String> keyTopics;
    private Instant createdAt;
    private Instant updatedAt;
    private Map<String, Object> metadata;

    public ConversationSummary() {}

    public ConversationSummary(String id, String sessionId, String customerId, String summaryText,
                               int messageCount, List<String> keyTopics, Instant createdAt, Instant updatedAt,
                               Map<String, Object> metadata) {
        this.id = id;
        this.sessionId = sessionId;
        this.customerId = customerId;
        this.summaryText = summaryText;
        this.messageCount = messageCount;
        this.keyTopics = keyTopics;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getSummaryText() {
        return summaryText;
    }

    public void setSummaryText(String summaryText) {
        this.summaryText = summaryText;
    }

    public int getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(int messageCount) {
        this.messageCount = messageCount;
    }

    public List<String> getKeyTopics() {
        return keyTopics == null ? Collections.emptyList() : keyTopics;
    }

    public void setKeyTopics(List<String> keyTopics) {
        this.keyTopics = keyTopics;
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

    public Map<String, Object> getMetadata() {
        return metadata == null ? Collections.emptyMap() : metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
