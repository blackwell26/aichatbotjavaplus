package com.company.chatbot.api;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.common.enums.EscalationTrigger;
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

class AgentEscalationControllerTest {

    @Test
    void list_and_manageEscalations_delegateToService() {
        EscalationWorkflowService service = mock(EscalationWorkflowService.class);
        Escalation escalation = new Escalation(9L, "session-1", "123", EscalationTrigger.CUSTOMER_REQUEST,
                EscalationStatus.PENDING, ConfidenceLevel.LOW, 0.3, "chat-session:session-1",
                "Need help", 88L, null, Instant.now(), Instant.now());
        when(service.listEscalations()).thenReturn(List.of(escalation));
        when(service.getEscalation(9L)).thenReturn(escalation);
        when(service.assignEscalation(9L, "agent-1")).thenReturn(escalation);
        when(service.updateStatus(9L, EscalationStatus.IN_PROGRESS)).thenReturn(escalation);

        AgentEscalationController controller = new AgentEscalationController(service);

        assertThat(controller.list().getBody()).hasSize(1);
        assertThat(controller.get(9L).getBody().getId()).isEqualTo(9L);
        assertThat(controller.assign(9L, new AgentEscalationController.AssignEscalationRequest("agent-1")).getBody().getId()).isEqualTo(9L);
        assertThat(controller.updateStatus(9L, new AgentEscalationController.UpdateEscalationStatusRequest(EscalationStatus.IN_PROGRESS)).getBody().getId()).isEqualTo(9L);
    }
}
