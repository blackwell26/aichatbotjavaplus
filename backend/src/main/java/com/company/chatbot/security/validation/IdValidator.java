package com.company.chatbot.security.validation;

import java.util.regex.Pattern;

public final class IdValidator {

    private static final Pattern SAFE_ID = Pattern.compile("^[a-zA-Z0-9._-]{1,128}$");
    private static final Pattern ORDER_NUMBER = Pattern.compile("^[A-Z0-9-]{3,64}$");

    private IdValidator() {}

    public static String requireValidSessionId(String sessionId) {
        return requireMatching(sessionId, SAFE_ID, "sessionId");
    }

    public static String requireValidResourceId(String resourceId, String fieldName) {
        return requireMatching(resourceId, SAFE_ID, fieldName);
    }

    public static String requireValidOrderNumber(String orderNumber) {
        return requireMatching(orderNumber, ORDER_NUMBER, "orderNumber");
    }

    private static String requireMatching(String value, Pattern pattern, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        String trimmed = value.trim();
        if (!pattern.matcher(trimmed).matches()) {
            throw new IllegalArgumentException(fieldName + " has an invalid format");
        }
        return trimmed;
    }
}
