package com.company.chatbot.intent;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

/**
 * Hybrid intent classification service.
 *
 * <p>Combines a fast deterministic rule classifier with an Ollama LLM fallback
 * in the following priority order:</p>
 *
 * <ol>
 *   <li><b>Disabled</b> – if {@code intent.classification.enabled=false}, immediately
 *       return {@code UNKNOWN} with a "disabled" fallback reason.</li>
 *   <li><b>Deterministic rules</b> – run first; a rule match produces a
 *       high-confidence result and short-circuits the pipeline.</li>
 *   <li><b>Ollama LLM</b> – run only when no rule fires; the model's result is
 *       accepted if its confidence score meets the configured minimum threshold.</li>
 *   <li><b>Low-confidence fallback</b> – when Ollama's score is below the threshold
 *       (or Ollama is unavailable), the classification falls back to
 *       {@code UNKNOWN} with an explanatory {@code fallbackReason}.</li>
 * </ol>
 */
@Service
public class IntentClassificationService {

    private static final Logger log = LoggerFactory.getLogger(IntentClassificationService.class);

    private final DeterministicIntentClassifier ruleClassifier;
    private final OllamaIntentClassifier ollamaClassifier;
    private final IntentClassificationProperties properties;

    public IntentClassificationService(DeterministicIntentClassifier ruleClassifier,
                                       OllamaIntentClassifier ollamaClassifier,
                                       IntentClassificationProperties properties) {
        this.ruleClassifier  = ruleClassifier;
        this.ollamaClassifier = ollamaClassifier;
        this.properties      = properties;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Classify the intent of the given customer message.
     *
     * <p>Never throws — all internal errors are caught and result in an
     * {@code UNKNOWN} classification with a fallback reason describing what
     * went wrong.</p>
     *
     * @param message the raw customer message
     * @return an {@link IntentClassification} — never {@code null}
     */
    public IntentClassification classify(String message) {
        if (!properties.isEnabled()) {
            log.debug("intent classification is disabled — returning UNKNOWN");
            return unknownFallback("Intent classification is disabled");
        }

        if (message == null || message.isBlank()) {
            return unknownFallback("Empty or null message");
        }

        // Step 1: Deterministic rules (fast path)
        try {
            Optional<IntentClassification> ruleResult = ruleClassifier.classify(message);
            if (ruleResult.isPresent()) {
                IntentClassification result = ruleResult.get();
                log.debug("intent classified by rules: intent={} score={}",
                        result.getIntentType(), result.getConfidenceScore());
                return result;
            }
        } catch (Exception ex) {
            log.warn("DeterministicIntentClassifier threw an unexpected exception: {}", ex.getMessage());
        }

        // Step 2: Ollama LLM (slow path)
        Optional<IntentClassification> ollamaResult = tryOllama(message);
        if (ollamaResult.isPresent()) {
            IntentClassification result = ollamaResult.get();
            log.debug("intent classified by Ollama: intent={} score={}",
                    result.getIntentType(), result.getConfidenceScore());
            return result;
        }

        // Step 3: Fallback — Ollama was unavailable or returned low confidence
        log.debug("intent classification fell back to UNKNOWN for message (length={})", message.length());
        return unknownFallback("No rule matched and Ollama classification was unavailable or below confidence threshold");
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Call the Ollama classifier and apply the minimum confidence threshold.
     * Returns empty if Ollama is unavailable or the score is too low.
     */
    private Optional<IntentClassification> tryOllama(String message) {
        Optional<IntentClassification> ollamaResult;
        try {
            ollamaResult = ollamaClassifier.classify(message);
        } catch (Exception ex) {
            log.warn("Ollama classifier threw an unexpected exception: {}", ex.getMessage());
            return Optional.empty();
        }

        if (ollamaResult.isEmpty()) {
            return Optional.empty();
        }

        IntentClassification result = ollamaResult.get();
        if (result.getConfidenceScore() < properties.getMinimumConfidenceThreshold()) {
            log.debug("Ollama result below threshold: intent={} score={} threshold={}",
                    result.getIntentType(),
                    result.getConfidenceScore(),
                    properties.getMinimumConfidenceThreshold());
            // Return an UNKNOWN result with a specific fallback reason
            return Optional.of(new IntentClassification(
                    IntentType.UNKNOWN,
                    ConfidenceLevel.LOW,
                    result.getConfidenceScore(),
                    String.format(
                            "Ollama confidence %.2f is below threshold %.2f",
                            result.getConfidenceScore(),
                            properties.getMinimumConfidenceThreshold()),
                    false,
                    result.getModelLabel(),
                    Instant.now()
            ));
        }

        return ollamaResult;
    }

    private IntentClassification unknownFallback(String reason) {
        return new IntentClassification(
                IntentType.UNKNOWN,
                ConfidenceLevel.LOW,
                0.0,
                reason,
                false,
                null,
                Instant.now()
        );
    }
}
