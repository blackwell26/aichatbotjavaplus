package com.company.chatbot.security;

import com.company.chatbot.context.CustomerContext;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ResourceOwnershipValidatorTest {

    private final ResourceOwnershipValidator validator =
            new ResourceOwnershipValidator(new RolePermissionEvaluator());

    @Test
    void allowsStaffToAccessAnyOrder() {
        CustomerContext manager = new CustomerContext("manager-1", "manager-1", List.of("ROLE_MANAGER"));

        assertDoesNotThrow(() -> validator.verifyOrderAccess(manager, "customer-99"));
    }

    @Test
    void deniesCustomerAccessToForeignOrder() {
        CustomerContext customer = new CustomerContext("customer-1", "customer-1", List.of("ROLE_CUSTOMER"));

        assertThrows(AccessDeniedException.class,
                () -> validator.verifyOrderAccess(customer, "customer-2"));
    }

    @Test
    void allowsCustomerAccessToOwnPaymentAndShippingData() {
        CustomerContext customer = new CustomerContext("customer-1", "customer-1", List.of("ROLE_CUSTOMER"));

        assertDoesNotThrow(() -> validator.verifyPaymentAccess(customer, "customer-1"));
        assertDoesNotThrow(() -> validator.verifyShippingAccess(customer, "customer-1"));
        assertDoesNotThrow(() -> validator.verifyRefundAccess(customer, "customer-1"));
    }
}
