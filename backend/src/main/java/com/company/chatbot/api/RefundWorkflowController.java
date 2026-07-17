package com.company.chatbot.api;

import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.RefundRequest;
import com.company.chatbot.ecommerce.RefundWorkflowService;
import com.company.chatbot.ecommerce.RefundWorkflowService.ReturnEligibilityResult;
import com.company.chatbot.security.validation.IdValidator;
import com.company.chatbot.security.validation.WorkflowRequestValidator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
@Validated
@PreAuthorize("hasAnyRole('CUSTOMER','AGENT','MANAGER','ADMIN','SYSTEM')")
@ConditionalOnBean(RefundWorkflowService.class)
public class RefundWorkflowController {

    private final RefundWorkflowService refundWorkflowService;

    public RefundWorkflowController(RefundWorkflowService refundWorkflowService) {
        this.refundWorkflowService = refundWorkflowService;
    }

    @PostMapping("/{orderNumber}/return-eligibility")
    public ResponseEntity<ReturnEligibilityResult> evaluateReturnEligibility(
            @PathVariable String orderNumber,
            @Valid @RequestBody ReturnEligibilityRequest request,
            @CurrentCustomer CustomerContext customer) {
        String reason = request == null ? null : request.reason();
        return ResponseEntity.ok(refundWorkflowService.evaluateReturnEligibility(
                IdValidator.requireValidOrderNumber(orderNumber), reason, customer));
    }

    @PostMapping("/{orderNumber}/refund-requests")
    public ResponseEntity<RefundRequest> createRefundRequest(
            @PathVariable String orderNumber,
            @Valid @RequestBody CreateRefundRequest request,
            @CurrentCustomer CustomerContext customer) {
        String validatedOrderNumber = IdValidator.requireValidOrderNumber(orderNumber);
        WorkflowRequestValidator.validateRefundRequest(validatedOrderNumber, request.reason());
        RefundRequest refundRequest = refundWorkflowService.createRefundRequest(validatedOrderNumber, request.reason(), customer);
        return ResponseEntity.status(HttpStatus.CREATED).body(refundRequest);
    }

    public record ReturnEligibilityRequest(@NotBlank String reason) {}
    public record CreateRefundRequest(@NotBlank String reason) {}
}
