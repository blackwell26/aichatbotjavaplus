package com.company.chatbot.intent;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

/**
 * Ollama-backed intent classifier using Spring AI {@link ChatClient}.
 *
 * <p>Sends the customer message to the configured Ollama model with a structured
 * system prompt that instructs the model to respond with a JSON object of the form:</p>
 *
 * <pre>{@code
 * {
 *   "intent": "ORDER_STATUS",
 *   "confidence": 0.87
 * }
 * }</pre>
 *
 * <p>The response is parsed, validated, and wrapped as an {@link IntentClassification}.
 * Any parse error, model error, or connectivity problem returns
 * {@link Optional#empty()} so the hybrid classifier can fall back gracefully.</p>
 */
@Component
@ConditionalOnBean(ChatClient.Builder.class)
public class OllamaIntentClassifier {

    private static final Logger log = LoggerFactory.getLogger(OllamaIntentClassifier.class);

    static final String SYSTEM_PROMPT = """
            You are an intent classification engine for a customer-service chatbot.
            Classify the customer message into exactly one of these intent categories:
            PRODUCT_INQUIRY, ORDER_STATUS, REFUND_REQUEST, SHIPPING_INQUIRY, PAYMENT_ISSUE, ACCOUNT_ISSUE, FAQ, ESCALATION_REQUEST, UNKNOWN.

            Rules:
            - PRODUCT_INQUIRY: questions about products, prices, availability, features, or specifications.
            - ORDER_STATUS: questions about the status or details of a specific order.
            - REFUND_REQUEST: requests for a refund, return, or cancellation.
            - SHIPPING_INQUIRY: questions about shipping, delivery, tracking, or estimated arrival.
            - PAYMENT_ISSUE: problems or questions about payments, charges, or billing.
            - ACCOUNT_ISSUE: issues with login, password, profile, or account settings.
            - FAQ: general questions about policies, how things work, or the company.
            - ESCALATION_REQUEST: explicit request to speak with a human agent or supervisor.
            - UNKNOWN: none of the above.

            Respond ONLY with a valid JSON object, no markdown, no extra text:
            {"intent":"<INTENT_CATEGORY>","confidence":<0.0-1.0>}
            """;

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final IntentClassificationProperties properties;

    public OllamaIntentClassifier(ChatClient.Builder chatClientBuilder,
                                  ObjectMapper objectMapper,
                                  IntentClassificationProperties properties) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Classify {@code message} using the Ollama LLM.
     *
     * @param message the customer message to classify
     * @return an {@link IntentClassification} when the model returns a usable result,
     *         or {@link Optional#empty()} when Ollama is unavailable or returns
     *         an unparseable response
     */
    public Optional<IntentClassification> classify(String message) {
        if (message == null || message.isBlank()) {
            return Optional.empty();
        }

        String truncated = truncate(message);
        try {
            String raw = chatClient
                    .prompt()
                    .system(SYSTEM_PROMPT)
                    .user(truncated)
                    .call()
                    .content();

            return parseResponse(raw);

        } catch (Exception ex) {
            log.warn("OllamaIntentClassifier: model call failed — {}", ex.getMessage());
            return Optional.empty();
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Parse the raw model response into an {@link IntentClassification}.
     *
     * <p>The model may include markdown fences or surrounding text; we extract the
     * first JSON object we find inside the response string.</p>
     */
    Optional<IntentClassification> parseResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }

        // Strip markdown code fences if present
        String cleaned = raw.strip();
        int jsonStart = cleaned.indexOf('{');
        int jsonEnd   = cleaned.lastIndexOf('}');
        if (jsonStart < 0 || jsonEnd < jsonStart) {
            log.warn("OllamaIntentClassifier: no JSON object found in response: {}", trimForLog(raw));
            return Optional.empty();
        }
        String json = cleaned.substring(jsonStart, jsonEnd + 1);

        try {
            OllamaResponse resp = objectMapper.readValue(json, OllamaResponse.class);

            IntentType intentType = parseIntentType(resp.intent());
            double confidence = clamp(resp.confidence());

            return Optional.of(new IntentClassification(
                    intentType,
                    ConfidenceLevel.fromScore(confidence),
                    confidence,
                    null,
                    false,
                    properties.getModel(),
                    Instant.now()
            ));

        } catch (Exception ex) {
            log.warn("OllamaIntentClassifier: failed to parse JSON '{}': {}", trimForLog(json), ex.getMessage());
            return Optional.empty();
        }
    }

    private IntentType parseIntentType(String label) {
        if (label == null) {
            return IntentType.UNKNOWN;
        }
        try {
            return IntentType.valueOf(label.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.debug("OllamaIntentClassifier: unknown intent label '{}', defaulting to UNKNOWN", label);
            return IntentType.UNKNOWN;
        }
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private String truncate(String message) {
        int max = properties.getMaxMessageLength();
        return message.length() > max ? message.substring(0, max) : message;
    }

    private static String trimForLog(String s) {
        if (s == null) return "<null>";
        return s.length() > 200 ? s.substring(0, 200) + "…" : s;
    }

    // -----------------------------------------------------------------------
    // Internal DTO for JSON deserialization
    // -----------------------------------------------------------------------

    /**
     * Simple record mapping the JSON response fields from Ollama.
     */
    record OllamaResponse(String intent, double confidence) {}
}
