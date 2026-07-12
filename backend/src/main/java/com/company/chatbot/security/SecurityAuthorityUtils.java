package com.company.chatbot.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

public final class SecurityAuthorityUtils {

    private static final String ROLE_PREFIX = "ROLE_";

    private SecurityAuthorityUtils() {}

    public static SimpleGrantedAuthority toAuthority(String role) {
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("role must not be blank");
        }
        String normalized = role.trim();
        if (!normalized.startsWith(ROLE_PREFIX)) {
            normalized = ROLE_PREFIX + normalized;
        }
        return new SimpleGrantedAuthority(normalized);
    }
}
