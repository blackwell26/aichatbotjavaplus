package com.company.chatbot.persistence.postgres.entity;

import com.company.chatbot.common.enums.RefundRequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "refund_requests")
public class RefundRequestEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 64)
    private String orderNumber;

    @Column(name = "customer_id", nullable = false, length = 128)
    private String customerId;

    @Column(name = "reason", columnDefinition = "text")
    private String reason;

    @Column(name = "amount", precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 64)
    private RefundRequestStatus status = RefundRequestStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "eligibility_snapshot", nullable = false)
    private Map<String, Object> eligibilitySnapshot = new HashMap<>();

    @Column(name = "payment_service_ref", length = 255)
    private String paymentServiceRef;

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
        return eligibilitySnapshot;
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
}
