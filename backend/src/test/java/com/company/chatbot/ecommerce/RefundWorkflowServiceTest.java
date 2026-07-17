package com.company.chatbot.ecommerce;

import com.company.chatbot.ai.AiSafetyService;
import com.company.chatbot.ai.AiSafetyProperties;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.client.OrderClient;
import com.company.chatbot.ecommerce.client.PaymentClient;
import com.company.chatbot.ecommerce.client.PaymentClient.RefundInitiation;
import com.company.chatbot.persistence.postgres.RefundRequestRepository;
import com.company.chatbot.persistence.postgres.entity.RefundRequestEntity;
import com.company.chatbot.rag.RagOrchestrationService;
import com.company.chatbot.security.ResourceOwnershipValidator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RefundWorkflowServiceTest {

    @Test
    void evaluateReturnEligibility_marksEligibleForDeliverdOrder() {
        RefundWorkflowService service = service();
        CustomerContext customer = new CustomerContext("cust-1", "Jane", List.of("CUSTOMER"));

        RefundWorkflowService.ReturnEligibilityResult result =
                service.evaluateReturnEligibility("ORD-1", "Damaged item", customer);

        assertThat(result.eligible()).isTrue();
        assertThat(result.snapshot()).containsEntry("orderNumber", "ORD-1");
    }

    @Test
    void createRefundRequest_persistsRefundAndCallsPaymentService() {
        RefundRequestRepository repository = mock(RefundRequestRepository.class);
        OrderClient orderClient = mock(OrderClient.class);
        PaymentClient paymentClient = mock(PaymentClient.class);
        ResourceOwnershipValidator ownershipValidator = mock(ResourceOwnershipValidator.class);

        when(orderClient.getOrderStatus("ORD-1")).thenReturn(
                new OrderClient.OrderStatus("ORD-1", "cust-1", "DELIVERED", "TRK-1", "USD", new BigDecimal("19.99")));
        when(paymentClient.initiateRefund(any())).thenReturn(new RefundInitiation("R-1", "PENDING", "PAY-1"));
        when(repository.save(any(RefundRequestEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefundWorkflowService service = new RefundWorkflowService(repository, orderClient, paymentClient,
                ownershipValidator, null, new AiSafetyService(new AiSafetyProperties()));

        RefundRequest refundRequest = service.createRefundRequest("ORD-1", "Damaged item",
                new CustomerContext("cust-1", "Jane", List.of("CUSTOMER")));

        assertThat(refundRequest.getOrderNumber()).isEqualTo("ORD-1");
        assertThat(refundRequest.getPaymentServiceRef()).isEqualTo("PAY-1");
    }

    @Test
    void createRefundRequest_rejectsIneligibleOrder() {
        RefundRequestRepository repository = mock(RefundRequestRepository.class);
        OrderClient orderClient = mock(OrderClient.class);
        PaymentClient paymentClient = mock(PaymentClient.class);
        ResourceOwnershipValidator ownershipValidator = mock(ResourceOwnershipValidator.class);

        when(orderClient.getOrderStatus("ORD-2")).thenReturn(
                new OrderClient.OrderStatus("ORD-2", "cust-1", "CANCELLED", "TRK-1", "USD", new BigDecimal("19.99")));

        RefundWorkflowService service = new RefundWorkflowService(repository, orderClient, paymentClient,
                ownershipValidator, null, new AiSafetyService(new AiSafetyProperties()));

        assertThatThrownBy(() -> service.createRefundRequest("ORD-2", "Changed mind",
                new CustomerContext("cust-1", "Jane", List.of("CUSTOMER"))))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void getRefundRequest_returnsMappedEntity() {
        RefundRequestRepository repository = mock(RefundRequestRepository.class);
        OrderClient orderClient = mock(OrderClient.class);
        PaymentClient paymentClient = mock(PaymentClient.class);
        ResourceOwnershipValidator ownershipValidator = mock(ResourceOwnershipValidator.class);

        RefundRequestEntity entity = new RefundRequestEntity();
        entity.setId(10L);
        entity.setOrderNumber("ORD-1");
        entity.setCustomerId("cust-1");
        entity.setReason("Damaged item");
        entity.setAmount(new BigDecimal("19.99"));
        entity.setPaymentServiceRef("PAY-1");

        when(repository.findById(10L)).thenReturn(java.util.Optional.of(entity));

        RefundWorkflowService service = new RefundWorkflowService(repository, orderClient, paymentClient,
                ownershipValidator, null, new AiSafetyService(new AiSafetyProperties()));

        RefundRequest refundRequest = service.getRefundRequest(10L, new CustomerContext("cust-1", "Jane", List.of("CUSTOMER")));

        assertThat(refundRequest.getId()).isEqualTo(10L);
        assertThat(refundRequest.getOrderNumber()).isEqualTo("ORD-1");
    }

    private RefundWorkflowService service() {
        RefundRequestRepository repository = mock(RefundRequestRepository.class);
        OrderClient orderClient = mock(OrderClient.class);
        PaymentClient paymentClient = mock(PaymentClient.class);
        ResourceOwnershipValidator ownershipValidator = mock(ResourceOwnershipValidator.class);
        RagOrchestrationService ragOrchestrationService = mock(RagOrchestrationService.class);

        when(orderClient.getOrderStatus(anyString())).thenReturn(
                new OrderClient.OrderStatus("ORD-1", "cust-1", "DELIVERED", "TRK-1", "USD", new BigDecimal("19.99")));
        when(ragOrchestrationService.buildPromptContext(any())).thenReturn(
                new com.company.chatbot.rag.RagPromptContext("hash", "Return policy", List.of(), List.of(), false, false, null));

        return new RefundWorkflowService(repository, orderClient, paymentClient, ownershipValidator,
                ragOrchestrationService, new AiSafetyService(new AiSafetyProperties()));
    }
}
