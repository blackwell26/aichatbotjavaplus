package com.company.chatbot.security;

import com.company.chatbot.persistence.redis.RateLimitRepository;
import com.company.chatbot.persistence.redis.RedisKeyStrategy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
@ConditionalOnBean(RateLimitRepository.class)
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitRepository rateLimitRepository;
    private final SecurityRateLimitProperties rateLimitProperties;

    public ApiRateLimitFilter(RateLimitRepository rateLimitRepository,
                              SecurityRateLimitProperties rateLimitProperties) {
        this.rateLimitRepository = rateLimitRepository;
        this.rateLimitProperties = rateLimitProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !rateLimitProperties.isEnabled() || resolveScope(request) == null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String scope = resolveScope(request);
        String actorId = resolveActorId(authentication);
        int maxRequests = resolveMaxRequests(scope);
        long count = rateLimitRepository.incrementAndGetForKey(
                RedisKeyStrategy.rateLimitScope(scope, actorId));

        if (count > maxRequests) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"rate_limit_exceeded\",\"message\":\"Too many requests\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveScope(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/chat/")) {
            return "chat";
        }
        if (path.startsWith("/api/v1/admin/knowledge/documents")) {
            return "admin-upload";
        }
        return null;
    }

    private int resolveMaxRequests(String scope) {
        if ("admin-upload".equals(scope)) {
            return rateLimitProperties.getAdminUploadMaxRequests();
        }
        return rateLimitProperties.getChatMaxRequests();
    }

    private String resolveActorId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthenticatedUser user) {
            return user.getCustomerId();
        }
        return authentication.getName();
    }
}
