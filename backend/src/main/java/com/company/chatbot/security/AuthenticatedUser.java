package com.company.chatbot.security;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Principal stored in the SecurityContext after JWT authentication.
 */
public class AuthenticatedUser {

    private final String username;
    private final String customerId;
    private final Collection<? extends GrantedAuthority> authorities;

    public AuthenticatedUser(String username, String customerId,
                             Collection<? extends GrantedAuthority> authorities) {
        this.username = username;
        this.customerId = customerId;
        this.authorities = authorities;
    }

    public String getUsername() {
        return username;
    }

    public String getCustomerId() {
        return customerId;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    public List<String> getRoles() {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }
}
