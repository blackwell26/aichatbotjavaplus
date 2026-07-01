package com.company.chatbot.context;

import com.company.chatbot.security.JwtService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Resolves CustomerContext from the current SecurityContext.
 * - If an Authentication exists, uses its name as username/customerId and maps authorities to roles.
 * - If no Authentication present, returns null.
 */
@Component
public class CustomerContextResolver {

    private final JwtService jwtService;

    public CustomerContextResolver(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public CustomerContext resolve() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        String username = auth.getName();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // Using username as customerId for now; in future map username->customerId via CustomerService or JWT claim.
        CustomerContext ctx = new CustomerContext(username, username, roles);
        CustomerContextHolder.set(ctx);
        return ctx;
    }
}
