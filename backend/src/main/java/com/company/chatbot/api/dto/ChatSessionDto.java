package com.company.chatbot.api.dto;

import java.time.Instant;

public class ChatSessionDto {
    private String id;
    private String customerId;
    private String status;
    private Instant createdAt;

    public ChatSessionDto() {}

    public ChatSessionDto(String id, String customerId, String status, Instant createdAt) {
        this.id = id;
        this.customerId = customerId;
        this.status = status;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
