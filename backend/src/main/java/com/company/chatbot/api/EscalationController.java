package com.company.chatbot.api;

import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.escalation.Escalation;
import com.company.chatbot.escalation.EscalationWorkflowService;
import com.company.chatbot.escalation.EscalationWorkflowService.EscalationRequest;
import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.EscalationTrigger;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat/sessions")
@Validated
@PreAuthorize("hasAnyRole('CUSTOMER','AGENT','MANAGER','ADMIN','SYSTEM')")
@ConditionalOnBean(EscalationWorkflowService.class)
public class EscalationController {

    private final EscalationWorkflowService escalationWorkflowService;

    public EscalationController(EscalationWorkflowService escalationWorkflowService) {
        this.escalationWorkflowService = escalationWorkflowService;
    }

    @PostMapping("/{sessionId}/escalate")
    public ResponseEntity<Escalation> escalate(@PathVariable String sessionId,
                                               @Valid @RequestBody EscalateRequest request,
                                               @CurrentCustomer CustomerContext customer) {
        Escalation escalation = escalationWorkflowService.createEscalation(
                sessionId,
                new EscalationRequest(request.trigger(), request.confidenceLevel(), request.confidenceScore(),
                        request.reason(), request.priority()),
                customer);
        return ResponseEntity.status(HttpStatus.CREATED).body(escalation);
    }

    public record EscalateRequest(EscalationTrigger trigger,
                                  ConfidenceLevel confidenceLevel,
                                  Double confidenceScore,
                                  @NotBlank String reason,
                                  String priority) {}
}
