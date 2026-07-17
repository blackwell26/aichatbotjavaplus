package com.company.chatbot.api;

import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.RefundRequest;
import com.company.chatbot.ecommerce.RefundWorkflowService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RefundRequestControllerTest {

    @Test
    void getRefundRequest_delegatesToService() {
        RefundWorkflowService service = mock(RefundWorkflowService.class);
        RefundRequest refundRequest = new RefundRequest(11L, "ORD-1", "cust-1", "Damaged item",
                new BigDecimal("19.99"), com.company.chatbot.common.enums.RefundRequestStatus.PENDING,
                Map.of(), "PAY-1", Instant.now(), Instant.now());
        when(service.getRefundRequest(eq(11L), any())).thenReturn(refundRequest);
        RefundRequestController controller = new RefundRequestController(service);

        RefundRequest response = controller.getRefundRequest(11L, new CustomerContext("cust-1", "Jane", List.of("CUSTOMER"))).getBody();

        assertThat(response.getOrderNumber()).isEqualTo("ORD-1");
    }
}
