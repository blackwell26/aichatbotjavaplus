package com.company.chatbot.api.dto;

/**
 * Response body for POST /api/v1/chat/sessions/{sessionId}/close.
 */
public class CloseSessionResponse {

    private ChatSessionDto session;
    private String message;

    public CloseSessionResponse() {}

    public CloseSessionResponse(ChatSessionDto session, String message) {
        this.session = session;
        this.message = message;
    }

    public ChatSessionDto getSession() { return session; }
    public void setSession(ChatSessionDto session) { this.session = session; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
