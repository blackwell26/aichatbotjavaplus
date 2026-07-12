package com.company.chatbot.api.dto;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * API representation of a chat session, returned on session create and get-session calls.
 */
public class ChatSessionDto {

    private String id;
    private String customerId;
    private String status;
    private String channel;
    private String escalationId;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant closedAt;
    private Map<String, Object> metadata;

    public ChatSessionDto() {}

    public ChatSessionDto(String id, String customerId, String status, Instant createdAt) {
        this.id = id;
        this.customerId = customerId;
        this.status = status;
        this.createdAt = createdAt;
    }

    public ChatSessionDto(String id, String customerId, String status, String channel,
                          String escalationId, Instant createdAt, Instant updatedAt,
                          Instant closedAt, Map<String, Object> metadata) {
        this.id = id;
        this.customerId = customerId;
        this.status = status;
        this.channel = channel;
        this.escalationId = escalationId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.closedAt = closedAt;
        this.metadata = metadata;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getEscalationId() { return escalationId; }
    public void setEscalationId(String escalationId) { this.escalationId = escalationId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public Map<String, Object> getMetadata() {
        return metadata == null ? Collections.emptyMap() : metadata;
    }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
