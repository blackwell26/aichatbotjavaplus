package com.company.chatbot.ecommerce;

import com.company.chatbot.ai.AiSafetyService;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.RefundRequestStatus;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.client.OrderClient;
import com.company.chatbot.ecommerce.client.PaymentClient;
import com.company.chatbot.ecommerce.client.PaymentClient.RefundInitiation;
import com.company.chatbot.ecommerce.client.PaymentClient.RefundInitiationRequest;
import com.company.chatbot.persistence.postgres.RefundRequestRepository;
import com.company.chatbot.persistence.postgres.entity.RefundRequestEntity;
import com.company.chatbot.rag.RagOrchestrationService;
import com.company.chatbot.rag.RagPromptContext;
import com.company.chatbot.rag.RagRequest;
import com.company.chatbot.security.ResourceOwnershipValidator;
import com.company.chatbot.security.validation.WorkflowRequestValidator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@ConditionalOnBean(RefundRequestRepository.class)
public class RefundWorkflowService {

    private final RefundRequestRepository refundRequestRepository;
    private final OrderClient orderClient;
    private final PaymentClient paymentClient;
    private final ResourceOwnershipValidator ownershipValidator;
    private final RagOrchestrationService ragOrchestrationService;
    private final AiSafetyService aiSafetyService;

    public RefundWorkflowService(RefundRequestRepository refundRequestRepository,
                                 OrderClient orderClient,
                                 PaymentClient paymentClient,
                                 ResourceOwnershipValidator ownershipValidator,
                                 RagOrchestrationService ragOrchestrationService,
                                 AiSafetyService aiSafetyService) {
        this.refundRequestRepository = refundRequestRepository;
        this.orderClient = orderClient;
        this.paymentClient = paymentClient;
        this.ownershipValidator = ownershipValidator;
        this.ragOrchestrationService = ragOrchestrationService;
        this.aiSafetyService = aiSafetyService;
    }

    public ReturnEligibilityResult evaluateReturnEligibility(String orderNumber, String reason, CustomerContext customer) {
        WorkflowRequestValidator.validateRefundRequest(orderNumber, reason);
        String validatedOrderNumber = orderNumber;
        OrderClient.OrderStatus order = orderClient.getOrderStatus(validatedOrderNumber);
        ownershipValidator.verifyOrderAccess(customer, order.customerId());

        boolean eligible = isEligible(order, reason);
        Map<String, Object> snapshot = baseSnapshot(order, reason);
        snapshot.put("eligible", eligible);
        snapshot.put("policyExplanation", returnPolicyExplanation(order, reason, customer, snapshot));
        snapshot.put("recommendedAction", eligible ? "ALLOW" : "ESCALATE");
        return new ReturnEligibilityResult(validatedOrderNumber, order.customerId(), eligible, snapshot);
    }

    public RefundRequest createRefundRequest(String orderNumber, String reason, CustomerContext customer) {
        WorkflowRequestValidator.validateRefundRequest(orderNumber, reason);
        String validatedOrderNumber = orderNumber;
        OrderClient.OrderStatus order = orderClient.getOrderStatus(validatedOrderNumber);
        ownershipValidator.verifyOrderAccess(customer, order.customerId());

        ReturnEligibilityResult eligibility = evaluateReturnEligibility(validatedOrderNumber, reason, customer);
        if (!eligibility.eligible()) {
            throw new IllegalStateException("Return is not eligible");
        }

        BigDecimal amount = order.total() instanceof BigDecimal total ? total : new BigDecimal(String.valueOf(order.total()));
        RefundInitiation initiation = paymentClient.initiateRefund(new RefundInitiationRequest(
                validatedOrderNumber,
                order.customerId(),
                amount,
                reason));

        RefundRequestEntity entity = new RefundRequestEntity();
        entity.setOrderNumber(validatedOrderNumber);
        entity.setCustomerId(order.customerId());
        entity.setReason(reason);
        entity.setAmount(amount);
        entity.setStatus(RefundRequestStatus.PENDING);
        entity.setEligibilitySnapshot(eligibility.snapshot());
        entity.setPaymentServiceRef(initiation == null ? null : initiation.paymentReference());

        RefundRequestEntity saved = refundRequestRepository.save(entity);
        return map(saved);
    }

    public RefundRequest getRefundRequest(Long requestId, CustomerContext customer) {
        if (requestId == null || requestId <= 0) {
            throw new IllegalArgumentException("requestId must be positive");
        }
        RefundRequestEntity entity = refundRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("refund request not found"));
        ownershipValidator.verifyRefundAccess(customer, entity.getCustomerId());
        return map(entity);
    }

    private boolean isEligible(OrderClient.OrderStatus order, String reason) {
        if (order == null || order.status() == null) {
            return false;
        }
        String status = order.status().trim().toUpperCase();
        return status.equals("DELIVERED") || status.equals("SHIPPED") || status.equals("FULFILLED");
    }

    private Map<String, Object> baseSnapshot(OrderClient.OrderStatus order, String reason) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("orderNumber", order.orderNumber());
        snapshot.put("orderStatus", order.status());
        snapshot.put("trackingNumber", order.trackingNumber());
        snapshot.put("currency", order.currency());
        snapshot.put("total", order.total());
        snapshot.put("reason", reason);
        return snapshot;
    }

    private String returnPolicyExplanation(OrderClient.OrderStatus order, String reason, CustomerContext customer,
                                           Map<String, Object> externalFacts) {
        if (ragOrchestrationService == null) {
            return aiSafetyService.buildSystemPrompt();
        }
        RagPromptContext context = ragOrchestrationService.buildPromptContext(new RagRequest(
                "Explain the return policy for order " + order.orderNumber() + " with reason: " + reason,
                customer,
                IntentType.REFUND_REQUEST,
                externalFacts,
                aiSafetyService.buildSystemPrompt()));
        return context.prompt();
    }

    private RefundRequest map(RefundRequestEntity entity) {
        RefundRequest request = new RefundRequest();
        request.setId(entity.getId());
        request.setOrderNumber(entity.getOrderNumber());
        request.setCustomerId(entity.getCustomerId());
        request.setReason(entity.getReason());
        request.setAmount(entity.getAmount());
        request.setStatus(entity.getStatus());
        request.setEligibilitySnapshot(entity.getEligibilitySnapshot());
        request.setPaymentServiceRef(entity.getPaymentServiceRef());
        request.setCreatedAt(entity.getCreatedAt());
        request.setUpdatedAt(entity.getUpdatedAt());
        return request;
    }

    public record ReturnEligibilityResult(String orderNumber, String customerId, boolean eligible,
                                          Map<String, Object> snapshot) {}
}
