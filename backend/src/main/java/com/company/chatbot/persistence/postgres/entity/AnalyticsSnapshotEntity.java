package com.company.chatbot.persistence.postgres.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "analytics_snapshots")
public class AnalyticsSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @Column(name = "chat_volume", nullable = false)
    private long chatVolume;

    @Column(name = "avg_response_time_ms", nullable = false)
    private double avgResponseTimeMs;

    @Column(name = "escalation_rate", nullable = false)
    private double escalationRate;

    @Column(name = "satisfaction_score")
    private Double satisfactionScore;

    @Column(name = "model_latency_ms", nullable = false)
    private double modelLatencyMs;

    @Column(name = "fallback_rate", nullable = false)
    private double fallbackRate;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) {
            recordedAt = Instant.now();
        }
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
