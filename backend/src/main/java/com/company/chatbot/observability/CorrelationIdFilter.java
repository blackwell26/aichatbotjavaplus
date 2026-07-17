package com.company.chatbot.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Populates MDC with request-scoped identifiers for logs and downstream propagation.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String SESSION_ID_HEADER = "X-Session-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = headerOrGenerate(request.getHeader(CORRELATION_ID_HEADER));
        String requestId = headerOrGenerate(request.getHeader(REQUEST_ID_HEADER));
        String sessionId = sanitize(request.getHeader(SESSION_ID_HEADER));
        String traceId = MDC.get("traceId");

        MDC.put("correlationId", correlationId);
        MDC.put("requestId", requestId);
        if (sessionId != null) {
            MDC.put("sessionId", sessionId);
        }
        response.setHeader(CORRELATION_ID_HEADER, correlationId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        if (sessionId != null) {
            response.setHeader(SESSION_ID_HEADER, sessionId);
        }

        if (traceId != null && !traceId.isBlank()) {
            MDC.put("traceId", traceId);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
            MDC.remove("requestId");
            MDC.remove("sessionId");
            MDC.remove("traceId");
        }
    }

    private static String sanitize(String value) {
        return value == null || value.isBlank() ? null : value.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private static String headerOrGenerate(String value) {
        return value == null || value.isBlank() ? UUID.randomUUID().toString() : value;
    }
}
