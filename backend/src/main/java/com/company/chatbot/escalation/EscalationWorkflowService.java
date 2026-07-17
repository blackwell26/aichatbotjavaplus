package com.company.chatbot.escalation;

import com.company.chatbot.ai.AiSafetyService;
import com.company.chatbot.chat.ChatMessage;
import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.chat.ChatSessionService;
import com.company.chatbot.chat.ConversationSummary;
import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.common.enums.EscalationTrigger;
import com.company.chatbot.common.enums.TicketStatus;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.persistence.mongo.ConversationSummaryDocumentRepository;
import com.company.chatbot.persistence.mongo.ConversationSummaryMapper;
import com.company.chatbot.persistence.postgres.EscalationRepository;
import com.company.chatbot.persistence.postgres.SupportTicketRepository;
import com.company.chatbot.persistence.postgres.TicketCommentRepository;
import com.company.chatbot.persistence.postgres.entity.EscalationEntity;
import com.company.chatbot.persistence.postgres.entity.SupportTicketEntity;
import com.company.chatbot.persistence.postgres.entity.TicketCommentEntity;
import com.company.chatbot.security.validation.IdValidator;
import com.company.chatbot.security.validation.WorkflowRequestValidator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@ConditionalOnBean(EscalationRepository.class)
public class EscalationWorkflowService {

    private final ChatSessionService chatSessionService;
    private final EscalationRepository escalationRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final ConversationSummaryDocumentRepository summaryRepository;
    private final AiSafetyService aiSafetyService;

    public EscalationWorkflowService(ChatSessionService chatSessionService,
                                     EscalationRepository escalationRepository,
                                     SupportTicketRepository supportTicketRepository,
                                     TicketCommentRepository ticketCommentRepository,
                                     ConversationSummaryDocumentRepository summaryRepository,
                                     AiSafetyService aiSafetyService) {
        this.chatSessionService = chatSessionService;
        this.escalationRepository = escalationRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.ticketCommentRepository = ticketCommentRepository;
        this.summaryRepository = summaryRepository;
        this.aiSafetyService = aiSafetyService;
    }

    public Escalation createEscalation(String sessionId, EscalationRequest request, CustomerContext customer) {
        String validatedSessionId = IdValidator.requireValidSessionId(sessionId);
        WorkflowRequestValidator.validateEscalationRequest(validatedSessionId, request.reason());
        ChatSession session = chatSessionService.resumeSession(validatedSessionId,
                customer == null ? null : customer.getCustomerId());

        List<ChatMessage> history = chatSessionService.getHistory(validatedSessionId);
        String summaryText = buildSummary(history, request.reason());
        String transcriptRef = "chat-session:" + validatedSessionId;

        SupportTicketEntity ticket = new SupportTicketEntity();
        ticket.setCustomerId(parseCustomerId(session.getCustomerId()));
        ticket.setSubject("Escalation for session " + validatedSessionId);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setPriority(priority(request, history));
        ticket.setExternalTicketRef(UUID.randomUUID().toString());
        ticket = supportTicketRepository.save(ticket);

        TicketCommentEntity comment = new TicketCommentEntity();
        comment.setTicketId(ticket.getId());
        comment.setAuthorId("system");
        comment.setAuthorRole(com.company.chatbot.common.enums.UserRole.SYSTEM);
        comment.setContent(summaryText);
        ticketCommentRepository.save(comment);

        EscalationEntity escalation = new EscalationEntity();
        escalation.setSessionId(validatedSessionId);
        escalation.setCustomerId(session.getCustomerId());
        escalation.setTrigger(resolveTrigger(request, history));
        escalation.setStatus(EscalationStatus.PENDING);
        escalation.setAiConfidenceLevel(request.confidenceLevel());
        escalation.setAiConfidenceScore(request.confidenceScore());
        escalation.setTranscriptRef(transcriptRef);
        escalation.setSummary(summaryText);
        escalation.setTicketId(ticket.getId());
        EscalationEntity saved = escalationRepository.save(escalation);

        summaryRepository.save(ConversationSummaryMapper.toDocument(buildConversationSummary(session, history, summaryText)));

        session.setEscalationId(saved.getId().toString());
        return map(saved);
    }

    public List<Escalation> listEscalations() {
        return escalationRepository.findAll().stream().map(this::map).toList();
    }

    public Escalation getEscalation(Long escalationId) {
        return escalationRepository.findById(escalationId).map(this::map)
                .orElseThrow(() -> new IllegalArgumentException("escalation not found"));
    }

    public Escalation assignEscalation(Long escalationId, String agentId) {
        EscalationEntity escalation = escalationRepository.findById(escalationId)
                .orElseThrow(() -> new IllegalArgumentException("escalation not found"));
        escalation.setAssignedAgentId(agentId);
        escalation.setStatus(EscalationStatus.ASSIGNED);
        return map(escalationRepository.save(escalation));
    }

    public Escalation updateStatus(Long escalationId, EscalationStatus status) {
        EscalationEntity escalation = escalationRepository.findById(escalationId)
                .orElseThrow(() -> new IllegalArgumentException("escalation not found"));
        escalation.setStatus(status);
        return map(escalationRepository.save(escalation));
    }

    private EscalationTrigger resolveTrigger(EscalationRequest request, List<ChatMessage> history) {
        if (request.trigger() != null) {
            return request.trigger();
        }
        if (request.confidenceLevel() != null && request.confidenceLevel().ordinal() <= ConfidenceLevel.LOW.ordinal()) {
            return EscalationTrigger.LOW_CONFIDENCE;
        }
        return EscalationTrigger.CUSTOMER_REQUEST;
    }

    private String priority(EscalationRequest request, List<ChatMessage> history) {
        if (request.priority() != null && !request.priority().isBlank()) {
            return request.priority().trim().toUpperCase();
        }
        return history.stream().anyMatch(ChatMessage::isEscalationFlag) ? "HIGH" : "NORMAL";
    }

    private String buildSummary(List<ChatMessage> history, String reason) {
        String transcript = history.stream()
                .map(msg -> msg.getSenderType() + ": " + msg.getContent())
                .collect(Collectors.joining("\n"));
        return aiSafetyService.redact((reason == null ? "" : reason) + "\n" + transcript);
    }

    private ConversationSummary buildConversationSummary(ChatSession session, List<ChatMessage> history, String summaryText) {
        ConversationSummary summary = new ConversationSummary();
        summary.setId(UUID.randomUUID().toString());
        summary.setSessionId(session.getId());
        summary.setCustomerId(session.getCustomerId());
        summary.setSummaryText(summaryText);
        summary.setMessageCount(history.size());
        summary.setKeyTopics(history.stream()
                .map(ChatMessage::getIntentType)
                .filter(java.util.Objects::nonNull)
                .map(Enum::name)
                .distinct()
                .toList());
        summary.setCreatedAt(Instant.now());
        summary.setUpdatedAt(Instant.now());
        summary.setMetadata(Map.of("escalation", true));
        return summary;
    }

    private Long parseCustomerId(String customerId) {
        if (customerId == null || customerId.isBlank()) {
            return null;
        }
        String digits = customerId.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return 0L;
        }
        try {
            return Long.parseLong(digits);
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private Escalation map(EscalationEntity entity) {
        Escalation escalation = new Escalation();
        escalation.setId(entity.getId());
        escalation.setSessionId(entity.getSessionId());
        escalation.setCustomerId(entity.getCustomerId());
        escalation.setTrigger(entity.getTrigger());
        escalation.setStatus(entity.getStatus());
        escalation.setAiConfidenceLevel(entity.getAiConfidenceLevel());
        escalation.setAiConfidenceScore(entity.getAiConfidenceScore());
        escalation.setTranscriptRef(entity.getTranscriptRef());
        escalation.setSummary(entity.getSummary());
        escalation.setTicketId(entity.getTicketId());
        escalation.setAssignedAgentId(entity.getAssignedAgentId());
        escalation.setCreatedAt(entity.getCreatedAt());
        escalation.setUpdatedAt(entity.getUpdatedAt());
        return escalation;
    }

    public record EscalationRequest(EscalationTrigger trigger, ConfidenceLevel confidenceLevel,
                                    Double confidenceScore, String reason, String priority) {}
}
