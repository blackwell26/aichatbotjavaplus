package com.company.chatbot.ecommerce.client;

import com.company.chatbot.ecommerce.EcommerceIntegrationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

@Service
@ConditionalOnBean(RestClient.Builder.class)
public class PaymentClient extends AbstractEcommerceClient {

    public PaymentClient(RestClient.Builder builder, EcommerceIntegrationProperties properties) {
        super(builder, properties.getPaymentService());
    }

    PaymentClient(RestClient restClient) {
        super(restClient);
    }

    public PaymentVerification verifyPayment(String paymentId) {
        return get("/api/v1/payments/" + paymentId + "/verification", PaymentVerification.class);
    }

    public PaymentIssueLookup lookupPaymentIssue(String orderNumber) {
        return get("/api/v1/payments/issues?orderNumber=" + orderNumber, PaymentIssueLookup.class);
    }

    public RefundStatus getRefundStatus(String refundId) {
        return get("/api/v1/refunds/" + refundId + "/status", RefundStatus.class);
    }

    public RefundInitiation initiateRefund(RefundInitiationRequest request) {
        return post("/api/v1/refunds", request, RefundInitiation.class);
    }

    public record PaymentVerification(String paymentId, boolean verified, String status, Map<String, Object> details) {}
    public record PaymentIssueLookup(String orderNumber, String issueCode, String description) {}
    public record RefundStatus(String refundId, String status, String paymentReference) {}
    public record RefundInitiationRequest(String orderNumber, String customerId, BigDecimal amount, String reason) {}
    public record RefundInitiation(String refundId, String status, String paymentReference) {}
}
