package com.company.chatbot.chat;

/**
 * Thrown when a chat session cannot be found, is inaccessible, or is in a state
 * that prevents the requested operation (e.g. appending to a closed session).
 */
public class ChatSessionNotFoundException extends RuntimeException {

    public ChatSessionNotFoundException(String message) {
        super(message);
    }

    public ChatSessionNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
