package com.company.chatbot.api;

import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.RefundRequest;
import com.company.chatbot.ecommerce.RefundWorkflowService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/refund-requests")
@Validated
@PreAuthorize("hasAnyRole('CUSTOMER','AGENT','MANAGER','ADMIN','SYSTEM')")
@ConditionalOnBean(RefundWorkflowService.class)
public class RefundRequestController {

    private final RefundWorkflowService refundWorkflowService;

    public RefundRequestController(RefundWorkflowService refundWorkflowService) {
        this.refundWorkflowService = refundWorkflowService;
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<RefundRequest> getRefundRequest(@PathVariable Long requestId,
                                                          @CurrentCustomer CustomerContext customer) {
        return ResponseEntity.ok(refundWorkflowService.getRefundRequest(requestId, customer));
    }
}
