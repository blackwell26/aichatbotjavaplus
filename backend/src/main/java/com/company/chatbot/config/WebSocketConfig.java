package com.company.chatbot.config;

import com.company.chatbot.security.WebSocketAuthChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Spring WebSocket / STOMP configuration.
 *
 * <h3>Topology</h3>
 * <ul>
 *   <li><b>Handshake endpoint</b>: {@code /ws/chat} – clients open the WebSocket here;
 *       a SockJS fallback is available for browsers that do not support raw WebSockets.</li>
 *   <li><b>Application destination prefix</b>: {@code /app} – messages sent to
 *       {@code /app/chat.send} are routed to {@link com.company.chatbot.chat.ChatWebSocketController}.</li>
 *   <li><b>Broker destinations</b>:
 *     <ul>
 *       <li>{@code /topic} – shared, session-scoped broadcast channel
 *           ({@code /topic/chat.sessions.{sessionId}})</li>
 *       <li>{@code /user/queue} – user-private reply channel
 *           ({@code /user/queue/chat})</li>
 *     </ul>
 *   </li>
 * </ul>
 *
 * <p>JWT authentication is enforced at the STOMP protocol level by
 * {@link WebSocketAuthChannelInterceptor}, which intercepts {@code CONNECT} frames
 * and sets an {@link org.springframework.security.core.Authentication} on the
 * simpUser session attribute before any message handler is invoked.</p>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authChannelInterceptor;

    public WebSocketConfig(WebSocketAuthChannelInterceptor authChannelInterceptor) {
        this.authChannelInterceptor = authChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-process simple broker for /topic (shared) and /user/queue (private)
        registry.enableSimpleBroker("/topic", "/user/queue");
        // Prefix for messages that route to @MessageMapping controllers
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix used by the simple broker to route user-targeted messages
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}
