package com.company.chatbot.chat;

/**
 * Value object returned by {@link ChatSessionService#appendMessage} after a message
 * has been persisted to the MongoDB transcript and the session state refreshed in Redis.
 *
 * <p>Carries the persisted {@link ChatMessage} and the updated {@link ChatSession}
 * so callers have a single return value to feed into the REST / WebSocket layer
 * without needing additional lookups.</p>
 */
public class MessageAppendResult {

    private final ChatMessage message;
    private final ChatSession session;

    public MessageAppendResult(ChatMessage message, ChatSession session) {
        if (message == null) {
            throw new IllegalArgumentException("message must not be null");
        }
        if (session == null) {
            throw new IllegalArgumentException("session must not be null");
        }
        this.message = message;
        this.session = session;
    }

    /** The persisted message record, including its generated ID and timestamp. */
    public ChatMessage getMessage() {
        return message;
    }

    /** The session as it exists after the append (status, updatedAt, etc.). */
    public ChatSession getSession() {
        return session;
    }
}
