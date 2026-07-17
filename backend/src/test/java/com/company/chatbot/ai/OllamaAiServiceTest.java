package com.company.chatbot.ai;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.rag.RagCitation;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OllamaAiServiceTest {

    @Test
    void generate_successCapturesMetadata() {
        OllamaAiProperties properties = properties();
        AtomicReference<String> promptRef = new AtomicReference<>();
        OllamaAiService service = new OllamaAiService(prompt -> {
            promptRef.set(prompt);
            return """
                   {
                     "responseText": "AI answer",
                     "intentType": "FAQ",
                     "confidenceScore": 0.91,
                     "citations": [
                       {
                         "documentId": 1,
                         "chunkId": 10,
                         "sourceTitle": "Returns",
                         "sourceType": "FAQ",
                         "version": 1,
                         "similarity": 0.92
                       }
                     ],
                     "escalationRecommended": false,
                     "metadata": {"channel":"web"}
                   }
                   """;
        }, properties, new AiSafetyService(new AiSafetyProperties()), new StructuredAiResponseParser(new com.fasterxml.jackson.databind.ObjectMapper()));

        OllamaAiResponse response = service.generate(request("Explain returns"));

        assertThat(response.fallback()).isFalse();
        assertThat(response.responseText()).isEqualTo("AI answer");
        assertThat(response.metadata().getModelName()).isEqualTo("llama3");
        assertThat(response.metadata().getPromptSize()).isGreaterThan("Explain returns".length());
        assertThat(response.metadata().getCompletionLatencyMs()).isNotNegative();
        assertThat(response.metadata().getFailureReason()).isNull();
        assertThat(response.metadata().getCitations()).hasSize(1);
        assertThat(promptRef.get()).contains("Customer context:", "Safety rules:");
        assertThat(promptRef.get()).doesNotContain("john@example.com");
    }

    @Test
    void generate_retriesTransientFailure() {
        OllamaAiProperties properties = properties();
        properties.setMaxAttempts(2);
        AtomicInteger attempts = new AtomicInteger();
        OllamaAiService service = new OllamaAiService(prompt -> {
            if (attempts.incrementAndGet() == 1) {
                throw new IllegalStateException("temporary outage");
            }
            return """
                   {"responseText":"Recovered answer","intentType":"FAQ","confidenceScore":0.88,"citations":[],"escalationRecommended":false,"metadata":{}}
                   """;
        }, properties, new AiSafetyService(new AiSafetyProperties()), new StructuredAiResponseParser(new com.fasterxml.jackson.databind.ObjectMapper()));

        OllamaAiResponse response = service.generate(request("Explain returns"));

        assertThat(response.fallback()).isFalse();
        assertThat(response.responseText()).isEqualTo("Recovered answer");
        assertThat(attempts).hasValue(2);
    }

    @Test
    void generate_returnsFallbackWhenOllamaUnavailable() {
        OllamaAiProperties properties = properties();
        properties.setMaxAttempts(1);
        OllamaAiService service = new OllamaAiService(prompt -> {
            throw new IllegalStateException("connection refused");
        }, properties, new AiSafetyService(new AiSafetyProperties()), new StructuredAiResponseParser(new com.fasterxml.jackson.databind.ObjectMapper()));

        OllamaAiResponse response = service.generate(request("Explain returns"));

        assertThat(response.fallback()).isTrue();
        assertThat(response.responseText()).isEqualTo(properties.getFallbackResponse());
        assertThat(response.metadata().getFailureReason()).contains("connection refused");
        assertThat(response.metadata().isEscalationRecommended()).isTrue();
        assertThat(response.metadata().getConfidenceScore()).isZero();
    }

    @Test
    void generate_timesOutAndReturnsFallback() {
        OllamaAiProperties properties = properties();
        properties.setTimeout(Duration.ofMillis(20));
        properties.setMaxAttempts(1);
        OllamaAiService service = new OllamaAiService(prompt -> {
            sleep(200);
            return "late";
        }, properties, new AiSafetyService(new AiSafetyProperties()), new StructuredAiResponseParser(new com.fasterxml.jackson.databind.ObjectMapper()));

        OllamaAiResponse response = service.generate(request("Explain returns"));

        assertThat(response.fallback()).isTrue();
        assertThat(response.metadata().getFailureReason()).isNotBlank();
    }

    @Test
    void generate_rejectsUnsupportedModel() {
        OllamaAiProperties properties = properties();
        properties.setChatModel("unsupported-model");
        OllamaAiService service = new OllamaAiService(prompt -> "unused", properties,
                new AiSafetyService(new AiSafetyProperties()), new StructuredAiResponseParser(new com.fasterxml.jackson.databind.ObjectMapper()));

        assertThatThrownBy(() -> service.generate(request("Explain returns")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported Ollama model");
    }

    private OllamaAiRequest request(String prompt) {
        return new OllamaAiRequest(
                "session-1",
                "message-1",
                prompt,
                IntentType.FAQ,
                List.of(new RagCitation(1L, 10L, "Returns", null, 1, 0.92)),
                Map.of("source", "test"));
    }

    private OllamaAiProperties properties() {
        OllamaAiProperties properties = new OllamaAiProperties();
        properties.setChatModel("llama3");
        properties.setSupportedModels(List.of("llama3", "mistral", "qwen", "gemma"));
        properties.setTimeout(Duration.ofSeconds(1));
        properties.setMaxAttempts(1);
        properties.setRetryBackoff(Duration.ZERO);
        properties.setCircuitBreakerMinimumCalls(2);
        properties.setCircuitBreakerSlidingWindowSize(2);
        return properties;
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
