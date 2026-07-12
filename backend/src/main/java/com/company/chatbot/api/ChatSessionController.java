package com.company.chatbot.api;

import com.company.chatbot.api.dto.ChatSessionDto;
import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.chat.ChatSessionService;
import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.security.AuditLogService;
import com.company.chatbot.security.validation.WorkflowRequestValidator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/sessions")
@Validated
@PreAuthorize("hasAnyRole('CUSTOMER','AGENT','MANAGER','ADMIN','SYSTEM')")
public class ChatSessionController {

    private final ChatSessionService sessionService;
    private final AuditLogService auditLogService;

    public ChatSessionController(ChatSessionService sessionService, AuditLogService auditLogService) {
        this.sessionService = sessionService;
        this.auditLogService = auditLogService;
    }

    public static class CreateRequest {
        public Map<String, Object> metadata;

        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    @PostMapping
    public ResponseEntity<ChatSessionDto> createSession(@CurrentCustomer CustomerContext customer,
                                                         @RequestBody(required = false) CreateRequest request) {
        Map<String, Object> metadata = WorkflowRequestValidator.validateMetadata(
                request != null ? request.getMetadata() : Map.of());
        ChatSession session = sessionService.createSession(customer, metadata);
        auditLogService.logSensitiveAction(
                customer,
                "CHAT_SESSION_CREATED",
                "chat_session",
                session.getId(),
                Map.of("status", session.getStatus().name())
        );
        ChatSessionDto dto = new ChatSessionDto(
                session.getId(),
                session.getCustomerId(),
                session.getStatus().name(),
                session.getCreatedAt()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
