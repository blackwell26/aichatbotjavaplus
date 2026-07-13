package com.company.chatbot.chat.ws;

import java.time.Instant;

/**
 * STOMP message payload broadcast to subscribers after a message is appended.
 *
 * <p>Published to two destinations:
 * <ul>
 *   <li>{@code /topic/chat.sessions.{sessionId}} – visible to all session subscribers
 *       (e.g. agents monitoring the session)</li>
 *   <li>{@code /user/queue/chat} – routed only to the sender's private queue</li>
 * </ul>
 * </p>
 */
public class OutboundChatMessage {

    private String messageId;
    private String sessionId;
    private String senderType;
    private String customerId;
    private String content;
    private Instant timestamp;
    private String intentType;
    private String confidenceLevel;
    private Double confidenceScore;
    private boolean escalationFlag;
    private String sessionStatus;

    public OutboundChatMessage() {}

    // Convenience factory for a persisted customer message
    public static OutboundChatMessage of(
            String messageId,
            String sessionId,
            String senderType,
            String customerId,
            String content,
            Instant timestamp,
            String sessionStatus) {
        OutboundChatMessage msg = new OutboundChatMessage();
        msg.messageId = messageId;
        msg.sessionId = sessionId;
        msg.senderType = senderType;
        msg.customerId = customerId;
        msg.content = content;
        msg.timestamp = timestamp;
        msg.sessionStatus = sessionStatus;
        return msg;
    }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getSenderType() { return senderType; }
    public void setSenderType(String senderType) { this.senderType = senderType; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getIntentType() { return intentType; }
    public void setIntentType(String intentType) { this.intentType = intentType; }

    public String getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(String confidenceLevel) { this.confidenceLevel = confidenceLevel; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public boolean isEscalationFlag() { return escalationFlag; }
    public void setEscalationFlag(boolean escalationFlag) { this.escalationFlag = escalationFlag; }

    public String getSessionStatus() { return sessionStatus; }
    public void setSessionStatus(String sessionStatus) { this.sessionStatus = sessionStatus; }
}
