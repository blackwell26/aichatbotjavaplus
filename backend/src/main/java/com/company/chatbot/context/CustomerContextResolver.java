package com.company.chatbot.context;

import com.company.chatbot.security.AuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Resolves CustomerContext from the current SecurityContext.
 */
@Component
public class CustomerContextResolver {

    public CustomerContext resolve() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Object principal = auth.getPrincipal();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        CustomerContext context;
        if (principal instanceof AuthenticatedUser user) {
            context = new CustomerContext(user.getCustomerId(), user.getUsername(), roles);
        } else {
            context = new CustomerContext(auth.getName(), auth.getName(), roles);
        }
        CustomerContextHolder.set(context);
        return context;
    }
}
