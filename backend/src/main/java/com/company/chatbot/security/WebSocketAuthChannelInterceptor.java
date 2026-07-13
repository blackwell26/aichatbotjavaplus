package com.company.chatbot.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.stream.Collectors;

/**
 * STOMP channel interceptor that enforces JWT authentication on WebSocket connections.
 *
 * <h3>Protocol flow</h3>
 * <ol>
 *   <li>The client opens a WebSocket and sends a {@code CONNECT} frame.</li>
 *   <li>This interceptor intercepts the frame <em>before</em> it reaches the broker.</li>
 *   <li>It reads the {@code Authorization} native header (value: {@code Bearer <token>}).</li>
 *   <li>The token is validated via {@link JwtTokenVerifier}. On success an
 *       {@link org.springframework.security.core.Authentication} is attached to the STOMP
 *       session so Spring Security and {@code @AuthenticationPrincipal} work correctly
 *       in {@link com.company.chatbot.chat.ChatWebSocketController}.</li>
 *   <li>If the token is missing or invalid an {@link IllegalArgumentException} is thrown,
 *       which Spring WebSocket translates to a {@code ERROR} STOMP frame and closes the
 *       connection.</li>
 * </ol>
 *
 * <p>Non-{@code CONNECT} frames are passed through unchanged; the session-level principal
 * set during {@code CONNECT} remains active for the lifetime of the WebSocket session.</p>
 */
@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    private final JwtTokenVerifier tokenVerifier;
    private final JwtService jwtService;

    public WebSocketAuthChannelInterceptor(JwtTokenVerifier tokenVerifier, JwtService jwtService) {
        this.tokenVerifier = tokenVerifier;
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Not a CONNECT frame – pass through; auth principal is inherited from the session
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket CONNECT rejected: missing or malformed Authorization header");
            throw new IllegalArgumentException("Missing or malformed Authorization header");
        }

        String token = authHeader.substring(7);

        if (!tokenVerifier.validate(token)) {
            log.warn("WebSocket CONNECT rejected: invalid JWT");
            throw new IllegalArgumentException("Invalid or expired JWT token");
        }

        try {
            String username = jwtService.getSubject(token);
            String customerId = jwtService.getCustomerId(token);
            Collection<SimpleGrantedAuthority> authorities = jwtService.getRoles(token)
                    .stream()
                    .map(SecurityAuthorityUtils::toAuthority)
                    .collect(Collectors.toList());

            AuthenticatedUser principal = new AuthenticatedUser(username, customerId, authorities);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, authorities);

            accessor.setUser(authentication);
            log.debug("WebSocket CONNECT authenticated: username={} customerId={}",
                    username, customerId);
        } catch (Exception ex) {
            log.warn("WebSocket CONNECT rejected: JWT processing error - {}", ex.getMessage());
            throw new IllegalArgumentException("JWT processing failed: " + ex.getMessage());
        }

        return message;
    }
}
