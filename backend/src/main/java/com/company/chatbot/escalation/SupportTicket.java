package com.company.chatbot.escalation;

import com.company.chatbot.common.enums.TicketStatus;

import java.time.Instant;

/**
 * Human support ticket created from chat or escalation workflows.
 */
public class SupportTicket {

    private Long id;
    private Long customerId;
    private String subject;
    private TicketStatus status;
    private String priority;
    private String assignedAgentId;
    private String externalTicketRef;
    private Instant createdAt;
    private Instant updatedAt;

    public SupportTicket() {}

    public SupportTicket(Long id, Long customerId, String subject, TicketStatus status, String priority,
                         String assignedAgentId, String externalTicketRef, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.customerId = customerId;
        this.subject = subject;
        this.status = status;
        this.priority = priority;
        this.assignedAgentId = assignedAgentId;
        this.externalTicketRef = externalTicketRef;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getAssignedAgentId() {
        return assignedAgentId;
    }

    public void setAssignedAgentId(String assignedAgentId) {
        this.assignedAgentId = assignedAgentId;
    }

    public String getExternalTicketRef() {
        return externalTicketRef;
    }

    public void setExternalTicketRef(String externalTicketRef) {
        this.externalTicketRef = externalTicketRef;
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
