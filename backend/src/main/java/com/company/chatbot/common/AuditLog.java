package com.company.chatbot.common;

import com.company.chatbot.common.enums.UserRole;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * Immutable audit record for security-sensitive and workflow actions.
 */
public class AuditLog {

    private Long id;
    private String actorId;
    private UserRole actorRole;
    private String action;
    private String resourceType;
    private String resourceId;
    private String correlationId;
    private Map<String, Object> details;
    private Instant timestamp;

    public AuditLog() {}

    public AuditLog(Long id, String actorId, UserRole actorRole, String action, String resourceType, String resourceId,
                    String correlationId, Map<String, Object> details, Instant timestamp) {
        this.id = id;
        this.actorId = actorId;
        this.actorRole = actorRole;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.correlationId = correlationId;
        this.details = details;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public UserRole getActorRole() {
        return actorRole;
    }

    public void setActorRole(UserRole actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public Map<String, Object> getDetails() {
        return details == null ? Collections.emptyMap() : details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
