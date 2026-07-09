package com.company.chatbot.escalation;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.common.enums.EscalationTrigger;

import java.time.Instant;

/**
 * Escalation record linking a chat session to human support.
 */
public class Escalation {

    private Long id;
    private String sessionId;
    private String customerId;
    private EscalationTrigger trigger;
    private EscalationStatus status;
    private ConfidenceLevel aiConfidenceLevel;
    private Double aiConfidenceScore;
    private String transcriptRef;
    private String summary;
    private Long ticketId;
    private String assignedAgentId;
    private Instant createdAt;
    private Instant updatedAt;

    public Escalation() {}

    public Escalation(Long id, String sessionId, String customerId, EscalationTrigger trigger, EscalationStatus status,
                      ConfidenceLevel aiConfidenceLevel, Double aiConfidenceScore, String transcriptRef, String summary,
                      Long ticketId, String assignedAgentId, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.customerId = customerId;
        this.trigger = trigger;
        this.status = status;
        this.aiConfidenceLevel = aiConfidenceLevel;
        this.aiConfidenceScore = aiConfidenceScore;
        this.transcriptRef = transcriptRef;
        this.summary = summary;
        this.ticketId = ticketId;
        this.assignedAgentId = assignedAgentId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public EscalationTrigger getTrigger() {
        return trigger;
    }

    public void setTrigger(EscalationTrigger trigger) {
        this.trigger = trigger;
    }

    public EscalationStatus getStatus() {
        return status;
    }

    public void setStatus(EscalationStatus status) {
        this.status = status;
    }

    public ConfidenceLevel getAiConfidenceLevel() {
        return aiConfidenceLevel;
    }

    public void setAiConfidenceLevel(ConfidenceLevel aiConfidenceLevel) {
        this.aiConfidenceLevel = aiConfidenceLevel;
    }

    public Double getAiConfidenceScore() {
        return aiConfidenceScore;
    }

    public void setAiConfidenceScore(Double aiConfidenceScore) {
        this.aiConfidenceScore = aiConfidenceScore;
    }

    public String getTranscriptRef() {
        return transcriptRef;
    }

    public void setTranscriptRef(String transcriptRef) {
        this.transcriptRef = transcriptRef;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Long getTicketId() {
        return ticketId;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public String getAssignedAgentId() {
        return assignedAgentId;
    }

    public void setAssignedAgentId(String assignedAgentId) {
        this.assignedAgentId = assignedAgentId;
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
