package com.company.chatbot.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "ai.ollama")
public class OllamaAiProperties {

    private String chatModel = "llama3";
    private String embeddingModel = "nomic-embed-text";
    private List<String> supportedModels = List.of("llama3", "mistral", "qwen", "gemma");
    private Duration timeout = Duration.ofSeconds(30);
    private int maxAttempts = 2;
    private Duration retryBackoff = Duration.ofMillis(250);
    private float circuitBreakerFailureRateThreshold = 50.0f;
    private int circuitBreakerSlidingWindowSize = 10;
    private int circuitBreakerMinimumCalls = 5;
    private Duration circuitBreakerOpenDuration = Duration.ofSeconds(30);
    private String fallbackResponse = "I cannot reach the AI service right now. Please try again shortly or request a human agent.";

    public String getChatModel() {
        return chatModel;
    }

    public void setChatModel(String chatModel) {
        this.chatModel = chatModel;
    }

    public String getEmbeddingModel() {
        return embeddingModel;
    }

    public void setEmbeddingModel(String embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public List<String> getSupportedModels() {
        return supportedModels;
    }

    public void setSupportedModels(List<String> supportedModels) {
        this.supportedModels = supportedModels;
    }

    public Duration getTimeout() {
        return timeout;
    }

    public void setTimeout(Duration timeout) {
        this.timeout = timeout;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Duration getRetryBackoff() {
        return retryBackoff;
    }

    public void setRetryBackoff(Duration retryBackoff) {
        this.retryBackoff = retryBackoff;
    }

    public float getCircuitBreakerFailureRateThreshold() {
        return circuitBreakerFailureRateThreshold;
    }

    public void setCircuitBreakerFailureRateThreshold(float circuitBreakerFailureRateThreshold) {
        this.circuitBreakerFailureRateThreshold = circuitBreakerFailureRateThreshold;
    }

    public int getCircuitBreakerSlidingWindowSize() {
        return circuitBreakerSlidingWindowSize;
    }

    public void setCircuitBreakerSlidingWindowSize(int circuitBreakerSlidingWindowSize) {
        this.circuitBreakerSlidingWindowSize = circuitBreakerSlidingWindowSize;
    }

    public int getCircuitBreakerMinimumCalls() {
        return circuitBreakerMinimumCalls;
    }

    public void setCircuitBreakerMinimumCalls(int circuitBreakerMinimumCalls) {
        this.circuitBreakerMinimumCalls = circuitBreakerMinimumCalls;
    }

    public Duration getCircuitBreakerOpenDuration() {
        return circuitBreakerOpenDuration;
    }

    public void setCircuitBreakerOpenDuration(Duration circuitBreakerOpenDuration) {
        this.circuitBreakerOpenDuration = circuitBreakerOpenDuration;
    }

    public String getFallbackResponse() {
        return fallbackResponse;
    }

    public void setFallbackResponse(String fallbackResponse) {
        this.fallbackResponse = fallbackResponse;
    }
}
