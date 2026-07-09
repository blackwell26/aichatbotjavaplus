package com.company.chatbot.intent;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;

import java.time.Instant;

/**
 * Result of hybrid intent classification for a customer message.
 */
public class IntentClassification {

    private IntentType intentType;
    private ConfidenceLevel confidenceLevel;
    private double confidenceScore;
    private String fallbackReason;
    private boolean ruleMatched;
    private String modelLabel;
    private Instant classifiedAt;

    public IntentClassification() {}

    public IntentClassification(IntentType intentType, ConfidenceLevel confidenceLevel, double confidenceScore,
                                String fallbackReason, boolean ruleMatched, String modelLabel, Instant classifiedAt) {
        this.intentType = intentType;
        this.confidenceLevel = confidenceLevel;
        this.confidenceScore = confidenceScore;
        this.fallbackReason = fallbackReason;
        this.ruleMatched = ruleMatched;
        this.modelLabel = modelLabel;
        this.classifiedAt = classifiedAt;
    }

    public static IntentClassification of(IntentType intentType, double confidenceScore, boolean ruleMatched) {
        return new IntentClassification(
                intentType,
                ConfidenceLevel.fromScore(confidenceScore),
                confidenceScore,
                null,
                ruleMatched,
                null,
                Instant.now()
        );
    }

    public IntentType getIntentType() {
        return intentType;
    }

    public void setIntentType(IntentType intentType) {
        this.intentType = intentType;
    }

    public ConfidenceLevel getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(ConfidenceLevel confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getFallbackReason() {
        return fallbackReason;
    }

    public void setFallbackReason(String fallbackReason) {
        this.fallbackReason = fallbackReason;
    }

    public boolean isRuleMatched() {
        return ruleMatched;
    }

    public void setRuleMatched(boolean ruleMatched) {
        this.ruleMatched = ruleMatched;
    }

    public String getModelLabel() {
        return modelLabel;
    }

    public void setModelLabel(String modelLabel) {
        this.modelLabel = modelLabel;
    }

    public Instant getClassifiedAt() {
        return classifiedAt;
    }

    public void setClassifiedAt(Instant classifiedAt) {
        this.classifiedAt = classifiedAt;
    }
}
