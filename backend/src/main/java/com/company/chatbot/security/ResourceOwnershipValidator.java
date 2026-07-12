package com.company.chatbot.security;

import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.persistence.postgres.RefundRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Validates customer ownership before exposing order, payment, refund, or shipping data.
 */
@Component
public class ResourceOwnershipValidator {

    private final RolePermissionEvaluator rolePermissionEvaluator;
    private RefundRequestRepository refundRequestRepository;

    public ResourceOwnershipValidator(RolePermissionEvaluator rolePermissionEvaluator) {
        this.rolePermissionEvaluator = rolePermissionEvaluator;
    }

    @Autowired(required = false)
    public void setRefundRequestRepository(RefundRequestRepository refundRequestRepository) {
        this.refundRequestRepository = refundRequestRepository;
    }

    public void verifyOrderAccess(CustomerContext context, String orderOwnerCustomerId) {
        verifyResourceOwner(context, orderOwnerCustomerId, "order");
    }

    public void verifyPaymentAccess(CustomerContext context, String paymentOwnerCustomerId) {
        verifyResourceOwner(context, paymentOwnerCustomerId, "payment");
    }

    public void verifyShippingAccess(CustomerContext context, String shippingOwnerCustomerId) {
        verifyResourceOwner(context, shippingOwnerCustomerId, "shipping");
    }

    public void verifyRefundAccess(CustomerContext context, String refundOwnerCustomerId) {
        verifyResourceOwner(context, refundOwnerCustomerId, "refund");
    }

    public void verifyRefundRequestAccess(CustomerContext context, Long refundRequestId) {
        requireAuthenticated(context);
        if (rolePermissionEvaluator.isStaff(context)) {
            return;
        }
        if (refundRequestRepository == null) {
            throw new AccessDeniedException("Refund ownership validation unavailable");
        }
        String ownerCustomerId = refundRequestRepository.findById(refundRequestId)
                .map(entity -> entity.getCustomerId())
                .orElseThrow(() -> new AccessDeniedException("Refund request not accessible"));
        verifyResourceOwner(context, ownerCustomerId, "refund request");
    }

    private void verifyResourceOwner(CustomerContext context, String resourceOwnerCustomerId, String resourceType) {
        requireAuthenticated(context);
        if (!rolePermissionEvaluator.canAccessCustomerResource(context, resourceOwnerCustomerId)) {
            throw new AccessDeniedException("Access denied to " + resourceType + " data");
        }
    }

    private void requireAuthenticated(CustomerContext context) {
        if (context == null || context.getCustomerId() == null || context.getCustomerId().isBlank()) {
            throw new AccessDeniedException("Authentication required");
        }
    }
}
