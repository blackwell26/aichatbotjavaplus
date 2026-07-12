package com.company.chatbot.security;

import com.company.chatbot.common.enums.UserRole;
import com.company.chatbot.context.CustomerContext;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RolePermissionEvaluatorTest {

    private final RolePermissionEvaluator evaluator = new RolePermissionEvaluator();

    @Test
    void staffRolesCanAccessAnyCustomerResource() {
        CustomerContext agent = new CustomerContext("agent-1", "agent-1", List.of("ROLE_AGENT"));

        assertTrue(evaluator.isStaff(agent));
        assertTrue(evaluator.canAccessCustomerResource(agent, "customer-99"));
    }

    @Test
    void customerCanAccessOnlyOwnResources() {
        CustomerContext customer = new CustomerContext("customer-1", "customer-1", List.of("ROLE_CUSTOMER"));

        assertFalse(evaluator.isStaff(customer));
        assertTrue(evaluator.canAccessCustomerResource(customer, "customer-1"));
        assertFalse(evaluator.canAccessCustomerResource(customer, "customer-2"));
    }

    @Test
    void resolvesPrimaryRoleByPrecedence() {
        CustomerContext context = new CustomerContext("user-1", "user-1",
                List.of("ROLE_CUSTOMER", "ROLE_ADMIN"));

        assertTrue(evaluator.hasRole(context, UserRole.ADMIN));
        assertEquals(UserRole.ADMIN, evaluator.resolvePrimaryRole(context));
    }

    private static void assertEquals(UserRole expected, UserRole actual) {
        org.junit.jupiter.api.Assertions.assertEquals(expected, actual);
    }
}
