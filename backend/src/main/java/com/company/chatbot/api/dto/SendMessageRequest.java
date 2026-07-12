package com.company.chatbot.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/v1/chat/sessions/{sessionId}/messages.
 *
 * <p>Only {@code content} is required from the customer. All AI-side metadata fields
 * (intent, confidence, latency, escalation) are populated by the service layer after
 * the AI pipeline processes the message.</p>
 */
public class SendMessageRequest {

    @NotBlank(message = "message content must not be blank")
    @Size(max = 4000, message = "message content must not exceed 4000 characters")
    private String content;

    public SendMessageRequest() {}

    public SendMessageRequest(String content) {
        this.content = content;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
