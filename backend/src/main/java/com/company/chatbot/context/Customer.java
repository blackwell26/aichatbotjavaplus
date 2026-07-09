package com.company.chatbot.context;

import java.time.Instant;
import java.util.UUID;

/**
 * Persisted customer identity referenced by operational workflows.
 */
public class Customer {

    private Long id;
    private UUID externalId;
    private String email;
    private Instant createdAt;

    public Customer() {}

    public Customer(Long id, UUID externalId, String email, Instant createdAt) {
        this.id = id;
        this.externalId = externalId;
        this.email = email;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getExternalId() {
        return externalId;
    }

    public void setExternalId(UUID externalId) {
        this.externalId = externalId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
