package com.company.chatbot.security.validation;

import java.util.Map;

public final class WorkflowRequestValidator {

    private static final int MAX_REASON_LENGTH = 2000;
    private static final int MAX_NOTES_LENGTH = 4000;

    private WorkflowRequestValidator() {}

    public static void validateRefundRequest(String orderNumber, String reason) {
        IdValidator.requireValidOrderNumber(orderNumber);
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("refund reason must not be blank");
        }
        if (reason.trim().length() > MAX_REASON_LENGTH) {
            throw new IllegalArgumentException("refund reason exceeds maximum length");
        }
    }

    public static void validateEscalationRequest(String sessionId, String reason) {
        IdValidator.requireValidSessionId(sessionId);
        if (reason != null && reason.trim().length() > MAX_NOTES_LENGTH) {
            throw new IllegalArgumentException("escalation reason exceeds maximum length");
        }
    }

    public static Map<String, Object> validateMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return Map.of();
        }
        if (metadata.size() > 20) {
            throw new IllegalArgumentException("metadata contains too many entries");
        }
        for (Map.Entry<String, Object> entry : metadata.entrySet()) {
            if (entry.getKey() == null || entry.getKey().isBlank()) {
                throw new IllegalArgumentException("metadata keys must not be blank");
            }
            if (entry.getKey().length() > 64) {
                throw new IllegalArgumentException("metadata key exceeds maximum length");
            }
        }
        return metadata;
    }
}
