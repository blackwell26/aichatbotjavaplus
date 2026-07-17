package com.company.chatbot.analytics;

import com.company.chatbot.persistence.mongo.AiResponseMetadataDocument;
import com.company.chatbot.persistence.mongo.AiResponseMetadataDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatMessageDocument;
import com.company.chatbot.persistence.mongo.ChatMessageDocumentRepository;
import com.company.chatbot.persistence.postgres.AnalyticsSnapshotRepository;
import com.company.chatbot.persistence.postgres.EscalationRepository;
import com.company.chatbot.persistence.postgres.entity.AnalyticsSnapshotEntity;
import com.company.chatbot.persistence.postgres.entity.EscalationEntity;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@ConditionalOnBean({ChatMessageDocumentRepository.class, EscalationRepository.class})
public class AnalyticsService {

    private final ChatMessageDocumentRepository chatMessageRepository;
    private final EscalationRepository escalationRepository;
    private final AiResponseMetadataDocumentRepository aiResponseMetadataRepository;
    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;

    public AnalyticsService(ChatMessageDocumentRepository chatMessageRepository,
                            EscalationRepository escalationRepository,
                            AiResponseMetadataDocumentRepository aiResponseMetadataRepository,
                            AnalyticsSnapshotRepository analyticsSnapshotRepository,
                            Optional<MeterRegistry> meterRegistry) {
        this.chatMessageRepository = chatMessageRepository;
        this.escalationRepository = escalationRepository;
        this.aiResponseMetadataRepository = aiResponseMetadataRepository;
        this.analyticsSnapshotRepository = analyticsSnapshotRepository;
        meterRegistry.ifPresent(this::bindMetrics);
    }

    public AnalyticsSnapshot aggregate(Instant periodStart, Instant periodEnd) {
        validatePeriod(periodStart, periodEnd);

        List<ChatMessageDocument> messages = chatMessageRepository.findByTimestampBetween(periodStart, periodEnd);
        List<EscalationEntity> escalations = escalationRepository.findByCreatedAtBetween(periodStart, periodEnd);
        List<AiResponseMetadataDocument> aiResponses = aiResponseMetadataRepository == null
                ? List.of()
                : aiResponseMetadataRepository.findByCreatedAtBetween(periodStart, periodEnd);

        long customerMessages = messages.stream()
                .filter(message -> "CUSTOMER".equalsIgnoreCase(message.getSenderType()))
                .count();

        DoubleSummaryStatistics responseTimeStats = messages.stream()
                .filter(message -> !"CUSTOMER".equalsIgnoreCase(message.getSenderType()))
                .map(ChatMessageDocument::getResponseLatencyMs)
                .filter(Objects::nonNull)
                .mapToDouble(Long::doubleValue)
                .summaryStatistics();

        DoubleSummaryStatistics modelLatencyStats = aiResponses.stream()
                .map(AiResponseMetadataDocument::getCompletionLatencyMs)
                .filter(Objects::nonNull)
                .mapToDouble(Long::doubleValue)
                .summaryStatistics();

        long fallbackCount = aiResponses.stream()
                .filter(response -> {
                    Map<String, Object> metadata = response.getMetadata();
                    return metadata != null && Boolean.TRUE.equals(metadata.get("fallback"));
                })
                .count();

        double escalationRate = customerMessages == 0 ? 0.0 : (double) escalations.size() / customerMessages;
        double avgResponseTimeMs = responseTimeStats.getCount() == 0 ? 0.0 : responseTimeStats.getAverage();
        double modelLatencyMs = modelLatencyStats.getCount() == 0 ? 0.0 : modelLatencyStats.getAverage();
        double fallbackRate = aiResponses.isEmpty() ? 0.0 : (double) fallbackCount / aiResponses.size();
        Double satisfactionScore = deriveSatisfactionScore(customerMessages, escalationRate, fallbackRate);

        return new AnalyticsSnapshot(
                null,
                periodStart,
                periodEnd,
                customerMessages,
                avgResponseTimeMs,
                escalationRate,
                satisfactionScore,
                modelLatencyMs,
                fallbackRate,
                Instant.now()
        );
    }

    public AnalyticsSnapshot record(Instant periodStart, Instant periodEnd) {
        AnalyticsSnapshot snapshot = aggregate(periodStart, periodEnd);
        AnalyticsSnapshotEntity saved = analyticsSnapshotRepository.save(toEntity(snapshot));
        snapshot.setId(saved.getId());
        snapshot.setRecordedAt(saved.getRecordedAt());
        return snapshot;
    }

    public List<AnalyticsSnapshot> listRecordedSnapshots(Instant start, Instant end) {
        validatePeriod(start, end);
        return analyticsSnapshotRepository.findByRecordedAtBetween(start, end).stream()
                .map(AnalyticsService::toDomain)
                .toList();
    }

    private void bindMetrics(MeterRegistry registry) {
        Gauge.builder("chatbot_analytics_service_up", this, service -> 1.0)
                .description("Analytics service availability gauge")
                .register(registry);
    }

    private static void validatePeriod(Instant periodStart, Instant periodEnd) {
        if (periodStart == null || periodEnd == null) {
            throw new IllegalArgumentException("periodStart and periodEnd are required");
        }
        if (!periodStart.isBefore(periodEnd)) {
            throw new IllegalArgumentException("periodStart must be before periodEnd");
        }
    }

    private static Double deriveSatisfactionScore(long customerMessages, double escalationRate, double fallbackRate) {
        if (customerMessages == 0) {
            return null;
        }
        double score = 5.0 - Math.min(2.0, escalationRate * 8.0) - Math.min(1.5, fallbackRate * 6.0);
        return Math.max(1.0, Math.min(5.0, score));
    }

    private static AnalyticsSnapshotEntity toEntity(AnalyticsSnapshot snapshot) {
        AnalyticsSnapshotEntity entity = new AnalyticsSnapshotEntity();
        entity.setPeriodStart(snapshot.getPeriodStart());
        entity.setPeriodEnd(snapshot.getPeriodEnd());
        entity.setChatVolume(snapshot.getChatVolume());
        entity.setAvgResponseTimeMs(snapshot.getAvgResponseTimeMs());
        entity.setEscalationRate(snapshot.getEscalationRate());
        entity.setSatisfactionScore(snapshot.getSatisfactionScore());
        entity.setModelLatencyMs(snapshot.getModelLatencyMs());
        entity.setFallbackRate(snapshot.getFallbackRate());
        entity.setRecordedAt(snapshot.getRecordedAt());
        return entity;
    }

    private static AnalyticsSnapshot toDomain(AnalyticsSnapshotEntity entity) {
        return new AnalyticsSnapshot(
                entity.getId(),
                entity.getPeriodStart(),
                entity.getPeriodEnd(),
                entity.getChatVolume(),
                entity.getAvgResponseTimeMs(),
                entity.getEscalationRate(),
                entity.getSatisfactionScore(),
                entity.getModelLatencyMs(),
                entity.getFallbackRate(),
                entity.getRecordedAt()
        );
    }
}
