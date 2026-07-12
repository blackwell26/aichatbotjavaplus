package com.company.chatbot.chat;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.MessageSenderType;

import java.util.Collections;
import java.util.Map;

/**
 * Value object representing a request to append a message to a chat session transcript.
 *
 * <p>Customer-submitted messages carry only {@code content} and {@code senderType}.
 * AI and agent responses additionally supply metadata such as intent, confidence,
 * latency, and escalation signals recorded after the response is generated.</p>
 */
public class SubmitMessageRequest {

    private final String sessionId;
    private final MessageSenderType senderType;
    private final String content;
    private final IntentType intentType;
    private final ConfidenceLevel confidenceLevel;
    private final Double confidenceScore;
    private final Long responseLatencyMs;
    private final boolean escalationFlag;
    private final Map<String, Object> metadata;

    private SubmitMessageRequest(Builder builder) {
        this.sessionId = builder.sessionId;
        this.senderType = builder.senderType;
        this.content = builder.content;
        this.intentType = builder.intentType;
        this.confidenceLevel = builder.confidenceLevel;
        this.confidenceScore = builder.confidenceScore;
        this.responseLatencyMs = builder.responseLatencyMs;
        this.escalationFlag = builder.escalationFlag;
        this.metadata = builder.metadata == null ? Map.of() : Map.copyOf(builder.metadata);
    }

    // --- Convenience factory methods ---

    /** Builds a minimal customer-turn request (no AI metadata). */
    public static SubmitMessageRequest customerMessage(String sessionId, String content) {
        return new Builder(sessionId, MessageSenderType.CUSTOMER, content).build();
    }

    /** Builds an AI-turn request with full metadata. */
    public static SubmitMessageRequest aiMessage(String sessionId, String content,
                                                  IntentType intentType,
                                                  ConfidenceLevel confidenceLevel,
                                                  Double confidenceScore,
                                                  Long responseLatencyMs,
                                                  boolean escalationFlag) {
        return new Builder(sessionId, MessageSenderType.AI, content)
                .intentType(intentType)
                .confidenceLevel(confidenceLevel)
                .confidenceScore(confidenceScore)
                .responseLatencyMs(responseLatencyMs)
                .escalationFlag(escalationFlag)
                .build();
    }

    // --- Getters ---

    public String getSessionId() {
        return sessionId;
    }

    public MessageSenderType getSenderType() {
        return senderType;
    }

    public String getContent() {
        return content;
    }

    public IntentType getIntentType() {
        return intentType;
    }

    public ConfidenceLevel getConfidenceLevel() {
        return confidenceLevel;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public Long getResponseLatencyMs() {
        return responseLatencyMs;
    }

    public boolean isEscalationFlag() {
        return escalationFlag;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    // --- Builder ---

    public static final class Builder {

        private final String sessionId;
        private final MessageSenderType senderType;
        private final String content;
        private IntentType intentType;
        private ConfidenceLevel confidenceLevel;
        private Double confidenceScore;
        private Long responseLatencyMs;
        private boolean escalationFlag;
        private Map<String, Object> metadata;

        public Builder(String sessionId, MessageSenderType senderType, String content) {
            if (sessionId == null || sessionId.isBlank()) {
                throw new IllegalArgumentException("sessionId must not be blank");
            }
            if (senderType == null) {
                throw new IllegalArgumentException("senderType must not be null");
            }
            if (content == null || content.isBlank()) {
                throw new IllegalArgumentException("content must not be blank");
            }
            this.sessionId = sessionId;
            this.senderType = senderType;
            this.content = content;
        }

        public Builder intentType(IntentType intentType) {
            this.intentType = intentType;
            return this;
        }

        public Builder confidenceLevel(ConfidenceLevel confidenceLevel) {
            this.confidenceLevel = confidenceLevel;
            return this;
        }

        public Builder confidenceScore(Double confidenceScore) {
            this.confidenceScore = confidenceScore;
            return this;
        }

        public Builder responseLatencyMs(Long responseLatencyMs) {
            this.responseLatencyMs = responseLatencyMs;
            return this;
        }

        public Builder escalationFlag(boolean escalationFlag) {
            this.escalationFlag = escalationFlag;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public SubmitMessageRequest build() {
            return new SubmitMessageRequest(this);
        }
    }
}
