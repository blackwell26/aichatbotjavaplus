package com.company.chatbot.persistence.postgres.entity;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.common.enums.EscalationTrigger;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "escalations")
public class EscalationEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(name = "customer_id", nullable = false, length = 128)
    private String customerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 64)
    private EscalationTrigger trigger;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 64)
    private EscalationStatus status = EscalationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_confidence_level", length = 16)
    private ConfidenceLevel aiConfidenceLevel;

    @Column(name = "ai_confidence_score")
    private Double aiConfidenceScore;

    @Column(name = "transcript_ref", length = 512)
    private String transcriptRef;

    @Column(name = "summary", columnDefinition = "text")
    private String summary;

    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "assigned_agent_id", length = 128)
    private String assignedAgentId;

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
}
