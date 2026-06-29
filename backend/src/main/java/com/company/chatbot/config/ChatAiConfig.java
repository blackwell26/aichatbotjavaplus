package com.company.chatbot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ai.chat.ChatClient;

/**
 * Example Spring AI ChatClient configuration using the Ollama provider.
 * Uses the auto-configured ChatClient.Builder provided by Spring AI when the
 * spring-ai-autoconfigure-model-ollama dependency is on the classpath.
 */
@Configuration
public class ChatAiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        // Build a ChatClient using defaults from configuration (application-*.yml)
        return builder.build();
    }
}
