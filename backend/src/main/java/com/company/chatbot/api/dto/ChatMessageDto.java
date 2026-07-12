package com.company.chatbot.api.dto;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * API representation of a single chat message, used in history and send-message responses.
 */
public class ChatMessageDto {

    private String id;
    private String sessionId;
    private String senderType;
    private String content;
    private Instant timestamp;
    private String intentType;
    private String confidenceLevel;
    private Double confidenceScore;
    private Long responseLatencyMs;
    private boolean escalationFlag;
    private Map<String, Object> metadata;

    public ChatMessageDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getSenderType() { return senderType; }
    public void setSenderType(String senderType) { this.senderType = senderType; }

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

    public Long getResponseLatencyMs() { return responseLatencyMs; }
    public void setResponseLatencyMs(Long responseLatencyMs) { this.responseLatencyMs = responseLatencyMs; }

    public boolean isEscalationFlag() { return escalationFlag; }
    public void setEscalationFlag(boolean escalationFlag) { this.escalationFlag = escalationFlag; }

    public Map<String, Object> getMetadata() {
        return metadata == null ? Collections.emptyMap() : metadata;
    }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
