package com.company.chatbot.security;

import com.company.chatbot.common.enums.UserRole;
import com.company.chatbot.context.CustomerContext;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;

/**
 * Evaluates RBAC roles and permissions for the authenticated customer context.
 */
@Component
public class RolePermissionEvaluator {

    private static final Set<UserRole> STAFF_ROLES =
            EnumSet.of(UserRole.AGENT, UserRole.MANAGER, UserRole.ADMIN, UserRole.SYSTEM);

    public boolean hasRole(CustomerContext context, UserRole role) {
        return context != null && context.hasRole(role);
    }

    public boolean hasAnyRole(CustomerContext context, UserRole... roles) {
        if (context == null || roles == null || roles.length == 0) {
            return false;
        }
        return Arrays.stream(roles).anyMatch(context::hasRole);
    }

    public boolean isStaff(CustomerContext context) {
        return hasAnyRole(context, STAFF_ROLES.toArray(UserRole[]::new));
    }

    public boolean canAccessCustomerResource(CustomerContext context, String resourceOwnerCustomerId) {
        if (context == null || resourceOwnerCustomerId == null || resourceOwnerCustomerId.isBlank()) {
            return false;
        }
        if (isStaff(context)) {
            return true;
        }
        return resourceOwnerCustomerId.equals(context.getCustomerId());
    }

    public UserRole resolvePrimaryRole(CustomerContext context) {
        if (context == null || context.getUserRoles().isEmpty()) {
            return UserRole.CUSTOMER;
        }
        for (UserRole role : new UserRole[]{
                UserRole.SYSTEM, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.CUSTOMER}) {
            if (context.hasRole(role)) {
                return role;
            }
        }
        return context.getUserRoles().getFirst();
    }
}
