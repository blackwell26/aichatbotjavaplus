package com.company.chatbot.common.enums;

public enum ConfidenceLevel {
    HIGH,
    MEDIUM,
    LOW;

    public static ConfidenceLevel fromScore(double score) {
        if (score >= 0.8) {
            return HIGH;
        }
        if (score >= 0.5) {
            return MEDIUM;
        }
        return LOW;
    }
}
