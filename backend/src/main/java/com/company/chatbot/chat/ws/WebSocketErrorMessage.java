package com.company.chatbot.chat.ws;

import java.time.Instant;

/**
 * Error payload sent to {@code /user/queue/errors} when a WebSocket message handler
 * encounters a validation or processing failure.
 */
public class WebSocketErrorMessage {

    private String errorCode;
    private String message;
    private String sessionId;
    private Instant timestamp;

    public WebSocketErrorMessage() {
        this.timestamp = Instant.now();
    }

    public WebSocketErrorMessage(String errorCode, String message, String sessionId) {
        this.errorCode = errorCode;
        this.message = message;
        this.sessionId = sessionId;
        this.timestamp = Instant.now();
    }

    public static WebSocketErrorMessage of(String errorCode, String message) {
        return new WebSocketErrorMessage(errorCode, message, null);
    }

    public static WebSocketErrorMessage of(String errorCode, String message, String sessionId) {
        return new WebSocketErrorMessage(errorCode, message, sessionId);
    }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
