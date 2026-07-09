package com.company.chatbot.analytics;

import java.time.Instant;

/**
 * Aggregated operational metrics captured for a reporting period.
 */
public class AnalyticsSnapshot {

    private Long id;
    private Instant periodStart;
    private Instant periodEnd;
    private long chatVolume;
    private double avgResponseTimeMs;
    private double escalationRate;
    private Double satisfactionScore;
    private double modelLatencyMs;
    private double fallbackRate;
    private Instant recordedAt;

    public AnalyticsSnapshot() {}

    public AnalyticsSnapshot(Long id, Instant periodStart, Instant periodEnd, long chatVolume, double avgResponseTimeMs,
                             double escalationRate, Double satisfactionScore, double modelLatencyMs,
                             double fallbackRate, Instant recordedAt) {
        this.id = id;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.chatVolume = chatVolume;
        this.avgResponseTimeMs = avgResponseTimeMs;
        this.escalationRate = escalationRate;
        this.satisfactionScore = satisfactionScore;
        this.modelLatencyMs = modelLatencyMs;
        this.fallbackRate = fallbackRate;
        this.recordedAt = recordedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(Instant periodStart) {
        this.periodStart = periodStart;
    }

    public Instant getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(Instant periodEnd) {
        this.periodEnd = periodEnd;
    }

    public long getChatVolume() {
        return chatVolume;
    }

    public void setChatVolume(long chatVolume) {
        this.chatVolume = chatVolume;
    }

    public double getAvgResponseTimeMs() {
        return avgResponseTimeMs;
    }

    public void setAvgResponseTimeMs(double avgResponseTimeMs) {
        this.avgResponseTimeMs = avgResponseTimeMs;
    }

    public double getEscalationRate() {
        return escalationRate;
    }

    public void setEscalationRate(double escalationRate) {
        this.escalationRate = escalationRate;
    }

    public Double getSatisfactionScore() {
        return satisfactionScore;
    }

    public void setSatisfactionScore(Double satisfactionScore) {
        this.satisfactionScore = satisfactionScore;
    }

    public double getModelLatencyMs() {
        return modelLatencyMs;
    }

    public void setModelLatencyMs(double modelLatencyMs) {
        this.modelLatencyMs = modelLatencyMs;
    }

    public double getFallbackRate() {
        return fallbackRate;
    }

    public void setFallbackRate(double fallbackRate) {
        this.fallbackRate = fallbackRate;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Instant recordedAt) {
        this.recordedAt = recordedAt;
    }
}
