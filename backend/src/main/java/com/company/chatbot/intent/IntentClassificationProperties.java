package com.company.chatbot.intent;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for the intent classification pipeline.
 *
 * <p>Bound from {@code intent.classification.*} in {@code application.yml} (or its
 * profile-specific variants).  All fields have safe defaults so the service starts
 * without any explicit YAML entry.</p>
 *
 * <h3>Key thresholds</h3>
 * <ul>
 *   <li><b>ruleConfidenceScore</b> – score assigned when a deterministic rule fires
 *       (always high-confidence by design).</li>
 *   <li><b>minimumConfidenceThreshold</b> – Ollama results whose score is below this
 *       value are considered low-confidence and fall back to {@code UNKNOWN}.</li>
 * </ul>
 */
@Component
@ConfigurationProperties(prefix = "intent.classification")
public class IntentClassificationProperties {

    /**
     * Whether intent classification is enabled at runtime.
     * When {@code false} every classify call returns {@code UNKNOWN} immediately.
     */
    private boolean enabled = true;

    /**
     * Ollama model to use for intent classification (e.g. {@code llama2}, {@code mistral}).
     * Defaults to the value set in {@code spring.ai.ollama.model} if not overridden.
     */
    private String model = "llama2";

    /**
     * Confidence score assigned to a deterministic-rule match (0.0 – 1.0).
     */
    private double ruleConfidenceScore = 0.95;

    /**
     * Minimum Ollama confidence score required to accept the model's classification.
     * Results below this threshold fall back to {@code UNKNOWN}.
     */
    private double minimumConfidenceThreshold = 0.5;

    /**
     * Maximum length (characters) of the message sent to Ollama.
     * Messages longer than this are truncated before classification.
     */
    private int maxMessageLength = 1000;

    // -----------------------------------------------------------------
    // Getters and setters (required by @ConfigurationProperties binding)
    // -----------------------------------------------------------------

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public double getRuleConfidenceScore() {
        return ruleConfidenceScore;
    }

    public void setRuleConfidenceScore(double ruleConfidenceScore) {
        this.ruleConfidenceScore = ruleConfidenceScore;
    }

    public double getMinimumConfidenceThreshold() {
        return minimumConfidenceThreshold;
    }

    public void setMinimumConfidenceThreshold(double minimumConfidenceThreshold) {
        this.minimumConfidenceThreshold = minimumConfidenceThreshold;
    }

    public int getMaxMessageLength() {
        return maxMessageLength;
    }

    public void setMaxMessageLength(int maxMessageLength) {
        this.maxMessageLength = maxMessageLength;
    }
}
