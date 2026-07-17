package com.company.chatbot.api;

import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.RefundRequest;
import com.company.chatbot.ecommerce.RefundWorkflowService;
import com.company.chatbot.ecommerce.RefundWorkflowService.ReturnEligibilityResult;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RefundWorkflowControllerTest {

    @Test
    void evaluateReturnEligibility_delegatesToService() {
        RefundWorkflowService service = mock(RefundWorkflowService.class);
        when(service.evaluateReturnEligibility(eq("ORD-1"), eq("Damaged item"), any()))
                .thenReturn(new ReturnEligibilityResult("ORD-1", "cust-1", true, Map.of("eligible", true)));
        RefundWorkflowController controller = new RefundWorkflowController(service);

        ReturnEligibilityResult result = controller.evaluateReturnEligibility("ORD-1",
                new RefundWorkflowController.ReturnEligibilityRequest("Damaged item"),
                new CustomerContext("cust-1", "Jane", List.of("CUSTOMER"))).getBody();

        assertThat(result.eligible()).isTrue();
    }

    @Test
    void createRefundRequest_delegatesToService() {
        RefundWorkflowService service = mock(RefundWorkflowService.class);
        RefundRequest refundRequest = new RefundRequest(7L, "ORD-1", "cust-1", "Damaged item",
                new BigDecimal("19.99"), com.company.chatbot.common.enums.RefundRequestStatus.PENDING,
                Map.of(), "PAY-1", Instant.now(), Instant.now());
        when(service.createRefundRequest(eq("ORD-1"), eq("Damaged item"), any())).thenReturn(refundRequest);
        RefundWorkflowController controller = new RefundWorkflowController(service);

        RefundRequest response = controller.createRefundRequest("ORD-1",
                new RefundWorkflowController.CreateRefundRequest("Damaged item"),
                new CustomerContext("cust-1", "Jane", List.of("CUSTOMER"))).getBody();

        assertThat(response.getId()).isEqualTo(7L);
    }
}
