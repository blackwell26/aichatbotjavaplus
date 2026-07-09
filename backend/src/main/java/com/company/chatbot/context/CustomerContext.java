package com.company.chatbot.context;

import com.company.chatbot.common.enums.UserRole;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Request-scoped view of the authenticated customer used by services and APIs.
 */
public class CustomerContext {

    private final String customerId;
    private final String username;
    private final List<String> roles;
    private final String locale;
    private final Map<String, Object> preferences;

    public CustomerContext(String customerId, String username, List<String> roles) {
        this(customerId, username, roles, null, null);
    }

    public CustomerContext(String customerId, String username, List<String> roles,
                           String locale, Map<String, Object> preferences) {
        this.customerId = customerId;
        this.username = username;
        this.roles = roles == null ? List.of() : List.copyOf(roles);
        this.locale = locale;
        this.preferences = preferences == null ? Map.of() : Map.copyOf(preferences);
    }

    public static CustomerContext fromProfile(Customer customer, CustomerProfile profile, List<String> roles) {
        String customerId = customer != null && customer.getExternalId() != null
                ? customer.getExternalId().toString()
                : null;
        String displayName = profile != null ? profile.getDisplayName() : null;
        String locale = profile != null ? profile.getLocale() : null;
        Map<String, Object> preferences = profile != null ? profile.getPreferences() : Map.of();
        return new CustomerContext(customerId, displayName, roles, locale, preferences);
    }

    public String getCustomerId() {
        return customerId;
    }

    public String getUsername() {
        return username;
    }

    public List<String> getRoles() {
        return roles;
    }

    public String getLocale() {
        return locale;
    }

    public Map<String, Object> getPreferences() {
        return preferences;
    }

    public List<UserRole> getUserRoles() {
        return roles.stream()
                .map(UserRole::fromAuthority)
                .flatMap(java.util.Optional::stream)
                .collect(Collectors.toList());
    }

    public boolean hasRole(UserRole role) {
        return getUserRoles().contains(role);
    }
}
