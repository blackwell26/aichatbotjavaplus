package com.company.chatbot.notification;

import com.company.chatbot.common.enums.NotificationStatus;
import com.company.chatbot.common.enums.NotificationType;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * Notification event published to messaging infrastructure.
 */
public class NotificationEvent {

    private String id;
    private NotificationType type;
    private NotificationStatus status;
    private String recipientId;
    private Map<String, Object> payload;
    private String correlationId;
    private Instant createdAt;

    public NotificationEvent() {}

    public NotificationEvent(String id, NotificationType type, NotificationStatus status, String recipientId,
                             Map<String, Object> payload, String correlationId, Instant createdAt) {
        this.id = id;
        this.type = type;
        this.status = status;
        this.recipientId = recipientId;
        this.payload = payload;
        this.correlationId = correlationId;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(String recipientId) {
        this.recipientId = recipientId;
    }

    public Map<String, Object> getPayload() {
        return payload == null ? Collections.emptyMap() : payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
