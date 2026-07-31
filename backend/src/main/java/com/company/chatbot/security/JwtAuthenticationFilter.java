package com.company.chatbot.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * JWT filter that validates Bearer tokens and sets Authentication in the SecurityContext.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenVerifier tokenVerifier;
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtTokenVerifier tokenVerifier, JwtService jwtService) {
        this.tokenVerifier = tokenVerifier;
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (tokenVerifier.validate(token)) {
                    String username = jwtService.getSubject(token);
                    String customerId = jwtService.getCustomerId(token);
                    Collection<SimpleGrantedAuthority> authorities = jwtService.getRoles(token)
                            .stream()
                            .map(SecurityAuthorityUtils::toAuthority)
                            .collect(Collectors.toList());

                    AuthenticatedUser principal = new AuthenticatedUser(username, customerId, authorities);
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            authorities
                    );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.debug("JWT authentication succeeded username={} customerId={}", username, customerId);
                } else {
                    log.warn("JWT authentication rejected: invalid token");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            } catch (Exception ex) {
                log.warn("JWT authentication error: {}", ex.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
