package com.company.chatbot.api;

import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.escalation.Escalation;
import com.company.chatbot.escalation.EscalationWorkflowService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agent/escalations")
@Validated
@PreAuthorize("hasAnyRole('AGENT','MANAGER','ADMIN','SYSTEM')")
@ConditionalOnBean(EscalationWorkflowService.class)
public class AgentEscalationController {

    private final EscalationWorkflowService escalationWorkflowService;

    public AgentEscalationController(EscalationWorkflowService escalationWorkflowService) {
        this.escalationWorkflowService = escalationWorkflowService;
    }

    @GetMapping
    public ResponseEntity<List<Escalation>> list() {
        return ResponseEntity.ok(escalationWorkflowService.listEscalations());
    }

    @GetMapping("/{escalationId}")
    public ResponseEntity<Escalation> get(@PathVariable Long escalationId) {
        return ResponseEntity.ok(escalationWorkflowService.getEscalation(escalationId));
    }

    @PutMapping("/{escalationId}/assign")
    public ResponseEntity<Escalation> assign(@PathVariable Long escalationId,
                                             @Valid @RequestBody AssignEscalationRequest request) {
        return ResponseEntity.ok(escalationWorkflowService.assignEscalation(escalationId, request.agentId()));
    }

    @PutMapping("/{escalationId}/status")
    public ResponseEntity<Escalation> updateStatus(@PathVariable Long escalationId,
                                                   @Valid @RequestBody UpdateEscalationStatusRequest request) {
        return ResponseEntity.ok(escalationWorkflowService.updateStatus(escalationId, request.status()));
    }

    public record AssignEscalationRequest(@NotBlank String agentId) {}
    public record UpdateEscalationStatusRequest(EscalationStatus status) {}
}
