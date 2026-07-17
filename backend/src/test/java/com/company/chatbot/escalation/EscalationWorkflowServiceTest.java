package com.company.chatbot.escalation;

import com.company.chatbot.ai.AiSafetyProperties;
import com.company.chatbot.ai.AiSafetyService;
import com.company.chatbot.chat.ChatMessage;
import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.chat.ChatSessionService;
import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.common.enums.EscalationTrigger;
import com.company.chatbot.common.enums.MessageSenderType;
import com.company.chatbot.common.enums.TicketStatus;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.persistence.mongo.ConversationSummaryDocumentRepository;
import com.company.chatbot.persistence.postgres.EscalationRepository;
import com.company.chatbot.persistence.postgres.SupportTicketRepository;
import com.company.chatbot.persistence.postgres.TicketCommentRepository;
import com.company.chatbot.persistence.postgres.entity.EscalationEntity;
import com.company.chatbot.persistence.postgres.entity.SupportTicketEntity;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EscalationWorkflowServiceTest {

    @Test
    void createEscalation_createsSupportTicketAndEscalation() {
        ChatSessionService chatSessionService = mock(ChatSessionService.class);
        EscalationRepository escalationRepository = mock(EscalationRepository.class);
        SupportTicketRepository supportTicketRepository = mock(SupportTicketRepository.class);
        TicketCommentRepository ticketCommentRepository = mock(TicketCommentRepository.class);
        ConversationSummaryDocumentRepository summaryRepository = mock(ConversationSummaryDocumentRepository.class);

        ChatSession session = new ChatSession("session-1", "123", ChatSessionStatus.ACTIVE, Instant.now(), Map.of());
        when(chatSessionService.resumeSession(anyString(), anyString())).thenReturn(session);
        when(chatSessionService.getHistory("session-1")).thenReturn(List.of(
                new ChatMessage("m1", "session-1", MessageSenderType.CUSTOMER, "Need help", Instant.now())));
        when(supportTicketRepository.save(any(SupportTicketEntity.class))).thenAnswer(invocation -> {
            SupportTicketEntity ticket = invocation.getArgument(0);
            ticket.setId(77L);
            return ticket;
        });
        when(escalationRepository.save(any(EscalationEntity.class))).thenAnswer(invocation -> {
            EscalationEntity entity = invocation.getArgument(0);
            entity.setId(55L);
            return entity;
        });

        EscalationWorkflowService service = new EscalationWorkflowService(
                chatSessionService, escalationRepository, supportTicketRepository, ticketCommentRepository,
                summaryRepository, new AiSafetyService(new AiSafetyProperties()));

        Escalation escalation = service.createEscalation("session-1",
                new EscalationWorkflowService.EscalationRequest(EscalationTrigger.CUSTOMER_REQUEST,
                        com.company.chatbot.common.enums.ConfidenceLevel.LOW, 0.3, "Need human help", "HIGH"),
                new CustomerContext("123", "Jane", List.of("CUSTOMER")));

        assertThat(escalation.getId()).isEqualTo(55L);
        assertThat(escalation.getTicketId()).isEqualTo(77L);
        assertThat(escalation.getStatus()).isEqualTo(EscalationStatus.PENDING);
    }

    @Test
    void assignAndUpdateStatus_work() {
        EscalationRepository escalationRepository = mock(EscalationRepository.class);
        EscalationEntity entity = new EscalationEntity();
        entity.setId(1L);
        entity.setSessionId("session-1");
        entity.setCustomerId("123");
        entity.setStatus(EscalationStatus.PENDING);
        when(escalationRepository.findById(1L)).thenReturn(java.util.Optional.of(entity));
        when(escalationRepository.save(any(EscalationEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EscalationWorkflowService service = new EscalationWorkflowService(
                mock(ChatSessionService.class), escalationRepository, mock(SupportTicketRepository.class),
                mock(TicketCommentRepository.class), mock(ConversationSummaryDocumentRepository.class),
                new AiSafetyService(new AiSafetyProperties()));

        assertThat(service.assignEscalation(1L, "agent-1").getAssignedAgentId()).isEqualTo("agent-1");
        assertThat(service.updateStatus(1L, EscalationStatus.IN_PROGRESS).getStatus()).isEqualTo(EscalationStatus.IN_PROGRESS);
    }
}
