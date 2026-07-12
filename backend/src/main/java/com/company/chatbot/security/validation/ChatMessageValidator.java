package com.company.chatbot.security.validation;

public final class ChatMessageValidator {

    public static final int MAX_MESSAGE_LENGTH = 4000;

    private ChatMessageValidator() {}

    public static String validate(String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message must not be blank");
        }
        String trimmed = message.trim();
        if (trimmed.length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("message exceeds maximum length of " + MAX_MESSAGE_LENGTH);
        }
        if (trimmed.indexOf('\0') >= 0) {
            throw new IllegalArgumentException("message contains invalid characters");
        }
        return trimmed;
    }
}
