package com.company.chatbot.api.dto;

import java.util.Collections;
import java.util.List;

/**
 * Response body for GET /api/v1/chat/sessions/{sessionId}/history.
 *
 * <p>Returns the full ordered message transcript for a session together with the
 * session metadata so the caller has complete context in a single response.</p>
 */
public class ChatHistoryResponse {

    private String sessionId;
    private List<ChatMessageDto> messages;
    private int totalMessages;

    public ChatHistoryResponse() {}

    public ChatHistoryResponse(String sessionId, List<ChatMessageDto> messages) {
        this.sessionId = sessionId;
        this.messages = messages == null ? Collections.emptyList() : List.copyOf(messages);
        this.totalMessages = this.messages.size();
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public List<ChatMessageDto> getMessages() {
        return messages == null ? Collections.emptyList() : messages;
    }
    public void setMessages(List<ChatMessageDto> messages) {
        this.messages = messages;
        this.totalMessages = messages == null ? 0 : messages.size();
    }

    public int getTotalMessages() { return totalMessages; }
    public void setTotalMessages(int totalMessages) { this.totalMessages = totalMessages; }
}
