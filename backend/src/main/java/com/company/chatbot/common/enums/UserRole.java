package com.company.chatbot.common.enums;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum UserRole {
    CUSTOMER,
    AGENT,
    MANAGER,
    ADMIN,
    SYSTEM;

    public static Optional<UserRole> fromAuthority(String authority) {
        if (authority == null || authority.isBlank()) {
            return Optional.empty();
        }
        String normalized = authority.trim();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }
        final String roleName = normalized.toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(role -> role.name().equals(roleName))
                .findFirst();
    }
}
