package com.company.chatbot.ecommerce;

import com.company.chatbot.common.enums.RefundRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * Customer refund request tied to an order and payment workflow.
 */
public class RefundRequest {

    private Long id;
    private String orderNumber;
    private String customerId;
    private String reason;
    private BigDecimal amount;
    private RefundRequestStatus status;
    private Map<String, Object> eligibilitySnapshot;
    private String paymentServiceRef;
    private Instant createdAt;
    private Instant updatedAt;

    public RefundRequest() {}

    public RefundRequest(Long id, String orderNumber, String customerId, String reason, BigDecimal amount,
                         RefundRequestStatus status, Map<String, Object> eligibilitySnapshot, String paymentServiceRef,
                         Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.customerId = customerId;
        this.reason = reason;
        this.amount = amount;
        this.status = status;
        this.eligibilitySnapshot = eligibilitySnapshot;
        this.paymentServiceRef = paymentServiceRef;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public RefundRequestStatus getStatus() {
        return status;
    }

    public void setStatus(RefundRequestStatus status) {
        this.status = status;
    }

    public Map<String, Object> getEligibilitySnapshot() {
        return eligibilitySnapshot == null ? Collections.emptyMap() : eligibilitySnapshot;
    }

    public void setEligibilitySnapshot(Map<String, Object> eligibilitySnapshot) {
        this.eligibilitySnapshot = eligibilitySnapshot;
    }

    public String getPaymentServiceRef() {
        return paymentServiceRef;
    }

    public void setPaymentServiceRef(String paymentServiceRef) {
        this.paymentServiceRef = paymentServiceRef;
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
