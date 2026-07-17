package com.company.chatbot.api;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.EscalationTrigger;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.escalation.Escalation;
import com.company.chatbot.escalation.EscalationWorkflowService;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EscalationControllerTest {

    @Test
    void escalate_delegatesToService() {
        EscalationWorkflowService service = mock(EscalationWorkflowService.class);
        Escalation escalation = new Escalation(9L, "session-1", "123", EscalationTrigger.CUSTOMER_REQUEST,
                com.company.chatbot.common.enums.EscalationStatus.PENDING, ConfidenceLevel.LOW, 0.3,
                "chat-session:session-1", "Need help", 88L, null, Instant.now(), Instant.now());
        when(service.createEscalation(eq("session-1"), any(), any())).thenReturn(escalation);

        EscalationController controller = new EscalationController(service);
        Escalation response = controller.escalate("session-1",
                new EscalationController.EscalateRequest(EscalationTrigger.CUSTOMER_REQUEST,
                        ConfidenceLevel.LOW, 0.3, "Need help", "HIGH"),
                new CustomerContext("123", "Jane", List.of("CUSTOMER"))).getBody();

        assertThat(response.getId()).isEqualTo(9L);
    }
}
