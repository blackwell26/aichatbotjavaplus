package com.company.chatbot.api.dto;

/**
 * Response body for POST /api/v1/chat/sessions/{sessionId}/messages.
 *
 * <p>Returns the persisted customer message and the updated session state.
 * When an AI response has been generated synchronously it is included in
 * {@code aiResponse}; otherwise that field is {@code null} and the AI reply
 * will arrive via WebSocket once Task #11 is implemented.</p>
 */
public class SendMessageResponse {

    private ChatMessageDto message;
    private ChatSessionDto session;
    private ChatMessageDto aiResponse;

    public SendMessageResponse() {}

    public SendMessageResponse(ChatMessageDto message, ChatSessionDto session) {
        this.message = message;
        this.session = session;
    }

    public SendMessageResponse(ChatMessageDto message, ChatSessionDto session,
                                ChatMessageDto aiResponse) {
        this.message = message;
        this.session = session;
        this.aiResponse = aiResponse;
    }

    public ChatMessageDto getMessage() { return message; }
    public void setMessage(ChatMessageDto message) { this.message = message; }

    public ChatSessionDto getSession() { return session; }
    public void setSession(ChatSessionDto session) { this.session = session; }

    public ChatMessageDto getAiResponse() { return aiResponse; }
    public void setAiResponse(ChatMessageDto aiResponse) { this.aiResponse = aiResponse; }
}
