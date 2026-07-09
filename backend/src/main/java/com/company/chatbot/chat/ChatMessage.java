package com.company.chatbot.chat;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.MessageSenderType;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * Domain model for a single message within a chat session transcript.
 */
public class ChatMessage {

    private String id;
    private String sessionId;
    private MessageSenderType senderType;
    private String content;
    private Instant timestamp;
    private IntentType intentType;
    private ConfidenceLevel confidenceLevel;
    private Double confidenceScore;
    private Long responseLatencyMs;
    private boolean escalationFlag;
    private Map<String, Object> metadata;

    public ChatMessage() {}

    public ChatMessage(String id, String sessionId, MessageSenderType senderType, String content, Instant timestamp) {
        this(id, sessionId, senderType, content, timestamp, null, null, null, null, false, null);
    }

    public ChatMessage(String id, String sessionId, MessageSenderType senderType, String content, Instant timestamp,
                       IntentType intentType, ConfidenceLevel confidenceLevel, Double confidenceScore,
                       Long responseLatencyMs, boolean escalationFlag, Map<String, Object> metadata) {
        this.id = id;
        this.sessionId = sessionId;
        this.senderType = senderType;
        this.content = content;
        this.timestamp = timestamp;
        this.intentType = intentType;
        this.confidenceLevel = confidenceLevel;
        this.confidenceScore = confidenceScore;
        this.responseLatencyMs = responseLatencyMs;
        this.escalationFlag = escalationFlag;
        this.metadata = metadata;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public MessageSenderType getSenderType() {
        return senderType;
    }

    public void setSenderType(MessageSenderType senderType) {
        this.senderType = senderType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public IntentType getIntentType() {
        return intentType;
    }

    public void setIntentType(IntentType intentType) {
        this.intentType = intentType;
    }

    public ConfidenceLevel getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(ConfidenceLevel confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public Long getResponseLatencyMs() {
        return responseLatencyMs;
    }

    public void setResponseLatencyMs(Long responseLatencyMs) {
        this.responseLatencyMs = responseLatencyMs;
    }

    public boolean isEscalationFlag() {
        return escalationFlag;
    }

    public void setEscalationFlag(boolean escalationFlag) {
        this.escalationFlag = escalationFlag;
    }

    public Map<String, Object> getMetadata() {
        return metadata == null ? Collections.emptyMap() : metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
