package com.company.chatbot.chat.ws;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * STOMP message payload sent by the client to {@code /app/chat.send}.
 *
 * <p>Only {@code sessionId} and {@code content} are required.  All other fields are
 * populated by the server-side AI pipeline after the message is processed.</p>
 */
public class InboundChatMessage {

    @NotBlank(message = "sessionId must not be blank")
    private String sessionId;

    @NotBlank(message = "message content must not be blank")
    @Size(max = 4000, message = "message content must not exceed 4000 characters")
    private String content;

    public InboundChatMessage() {}

    public InboundChatMessage(String sessionId, String content) {
        this.sessionId = sessionId;
        this.content = content;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
