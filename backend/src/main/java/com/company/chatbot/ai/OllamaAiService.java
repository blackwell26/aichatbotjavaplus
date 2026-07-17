package com.company.chatbot.ai;

import com.company.chatbot.chat.AiResponseMetadata;
import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.rag.RagCitation;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
@ConditionalOnBean(OllamaChatGateway.class)
public class OllamaAiService {

    private final OllamaChatGateway chatGateway;
    private final OllamaAiProperties properties;
    private final AiSafetyService aiSafetyService;
    private final StructuredAiResponseParser responseParser;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public OllamaAiService(OllamaChatGateway chatGateway,
                           OllamaAiProperties properties,
                           AiSafetyService aiSafetyService,
                           StructuredAiResponseParser responseParser) {
        this.chatGateway = chatGateway;
        this.properties = properties;
        this.aiSafetyService = aiSafetyService;
        this.responseParser = responseParser;
        this.circuitBreaker = CircuitBreaker.of("ollama-chat", CircuitBreakerConfig.custom()
                .failureRateThreshold(properties.getCircuitBreakerFailureRateThreshold())
                .slidingWindowSize(properties.getCircuitBreakerSlidingWindowSize())
                .minimumNumberOfCalls(properties.getCircuitBreakerMinimumCalls())
                .waitDurationInOpenState(properties.getCircuitBreakerOpenDuration())
                .build());
        this.retry = Retry.of("ollama-chat", RetryConfig.custom()
                .maxAttempts(Math.max(1, properties.getMaxAttempts()))
                .waitDuration(properties.getRetryBackoff())
                .retryExceptions(RuntimeException.class)
                .build());
    }

    public OllamaAiResponse generate(OllamaAiRequest request) {
        validate(request);
        long started = System.nanoTime();
        String selectedModel = selectModel(properties.getChatModel());
        String prompt = aiSafetyService.buildPrompt(
                new com.company.chatbot.rag.RagRequest(
                        request.prompt(),
                        null,
                        request.intentType(),
                        request.metadata(),
                        aiSafetyService.buildStructuredSystemPrompt()),
                null,
                request.metadata());
        Supplier<String> supplier = Retry.decorateSupplier(retry,
                CircuitBreaker.decorateSupplier(circuitBreaker, () -> callWithTimeout(prompt)));

        try {
            String raw = supplier.get();
            StructuredAiResponse structured = responseParser.parse(raw);
            long latencyMs = elapsedMs(started);
            AiResponseMetadata metadata = metadata(request, structured, selectedModel, prompt.length(), latencyMs, null, false);
            return new OllamaAiResponse(structured.responseText(), metadata, false);
        } catch (Exception ex) {
            long latencyMs = elapsedMs(started);
            String failureReason = failureReason(ex);
            String fallback = properties.getFallbackResponse();
            return new OllamaAiResponse(fallback, metadata(request, fallback, selectedModel,
                    latencyMs, failureReason, true), true);
        }
    }

    public List<String> supportedModels() {
        return properties.getSupportedModels();
    }

    private String callWithTimeout(String prompt) {
        try {
            return CompletableFuture.supplyAsync(() -> chatGateway.generate(prompt))
                    .get(properties.getTimeout().toMillis(), TimeUnit.MILLISECONDS);
        } catch (Exception ex) {
            throw new OllamaAiUnavailableException("Ollama chat request failed", ex);
        }
    }

    private AiResponseMetadata metadata(OllamaAiRequest request, StructuredAiResponse structured, String modelName,
                                        int promptSize, long latencyMs, String failureReason, boolean fallback) {
        AiResponseMetadata metadata = new AiResponseMetadata();
        metadata.setId(UUID.randomUUID().toString());
        metadata.setSessionId(request.sessionId());
        metadata.setMessageId(request.messageId());
        metadata.setResponseText(structured.responseText());
        metadata.setIntentType(structured.intentType() != null ? structured.intentType() : request.intentType());
        metadata.setConfidenceLevel(ConfidenceLevel.fromScore(structured.confidenceScore()));
        metadata.setConfidenceScore(structured.confidenceScore());
        metadata.setModelName(modelName);
        metadata.setPromptSize(promptSize);
        metadata.setCompletionLatencyMs(latencyMs);
        metadata.setFailureReason(failureReason);
        metadata.setCitations(citationMaps(structured.citations().isEmpty() ? request.citations() : structured.citations()));
        metadata.setEscalationRecommended(fallback || structured.escalationRecommended());
        metadata.setCreatedAt(Instant.now());
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("fallback", fallback);
        details.put("supportedModels", properties.getSupportedModels());
        if (request.metadata() != null) {
            details.putAll(request.metadata());
        }
        details.put("structuredResponse", structured.metadata());
        metadata.setMetadata(details);
        return metadata;
    }

    private AiResponseMetadata metadata(OllamaAiRequest request, String responseText, String modelName,
                                        long latencyMs, String failureReason, boolean fallback) {
        StructuredAiResponse structured = new StructuredAiResponse(
                responseText,
                request.intentType(),
                fallback ? 0.0 : 0.85,
                request.citations(),
                fallback,
                request.metadata());
        return metadata(request, structured, modelName, request.prompt().length(), latencyMs, failureReason, fallback);
    }

    private List<Map<String, Object>> citationMaps(List<RagCitation> citations) {
        if (citations == null) {
            return List.of();
        }
        return citations.stream().map(citation -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("documentId", citation.documentId());
            map.put("chunkId", citation.chunkId());
            map.put("sourceTitle", citation.sourceTitle());
            map.put("sourceType", citation.sourceType() == null ? null : citation.sourceType().name());
            map.put("version", citation.version());
            map.put("similarity", citation.similarity());
            return map;
        }).toList();
    }

    private String selectModel(String configuredModel) {
        if (configuredModel == null || configuredModel.isBlank()) {
            return properties.getSupportedModels().getFirst();
        }
        String normalized = configuredModel.trim().toLowerCase();
        boolean supported = properties.getSupportedModels().stream()
                .map(model -> model.toLowerCase())
                .anyMatch(model -> model.equals(normalized) || normalized.startsWith(model));
        if (!supported) {
            throw new IllegalArgumentException("Unsupported Ollama model: " + configuredModel);
        }
        return configuredModel.trim();
    }

    private String failureReason(Exception ex) {
        Throwable root = ex;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        if (ex instanceof CallNotPermittedException) {
            return "Ollama circuit breaker is open";
        }
        return root.getMessage() == null ? root.getClass().getSimpleName() : root.getMessage();
    }

    private long elapsedMs(long started) {
        return Duration.ofNanos(System.nanoTime() - started).toMillis();
    }

    private void validate(OllamaAiRequest request) {
        if (request == null || request.prompt() == null || request.prompt().isBlank()) {
            throw new IllegalArgumentException("prompt must not be blank");
        }
    }
}
