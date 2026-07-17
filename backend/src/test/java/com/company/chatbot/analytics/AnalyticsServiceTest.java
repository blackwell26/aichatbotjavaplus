package com.company.chatbot.analytics;

import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.common.enums.EscalationTrigger;
import com.company.chatbot.persistence.mongo.AiResponseMetadataDocument;
import com.company.chatbot.persistence.mongo.AiResponseMetadataDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatMessageDocument;
import com.company.chatbot.persistence.mongo.ChatMessageDocumentRepository;
import com.company.chatbot.persistence.postgres.AnalyticsSnapshotRepository;
import com.company.chatbot.persistence.postgres.EscalationRepository;
import com.company.chatbot.persistence.postgres.entity.AnalyticsSnapshotEntity;
import com.company.chatbot.persistence.postgres.entity.EscalationEntity;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AnalyticsServiceTest {

    private final ChatMessageDocumentRepository chatMessageRepository = Mockito.mock(ChatMessageDocumentRepository.class);
    private final EscalationRepository escalationRepository = Mockito.mock(EscalationRepository.class);
    private final AiResponseMetadataDocumentRepository aiResponseMetadataRepository = Mockito.mock(AiResponseMetadataDocumentRepository.class);
    private final AnalyticsSnapshotRepository analyticsSnapshotRepository = Mockito.mock(AnalyticsSnapshotRepository.class);

    @Test
    void aggregatesMetricsFromOperationalData() {
        Instant start = Instant.parse("2026-07-01T00:00:00Z");
        Instant end = Instant.parse("2026-07-02T00:00:00Z");

        when(chatMessageRepository.findByTimestampBetween(start, end)).thenReturn(List.of(
                message("CUSTOMER", 120L),
                message("AI", 80L),
                message("CUSTOMER", null)
        ));
        when(escalationRepository.findByCreatedAtBetween(start, end)).thenReturn(List.of(escalation()));
        when(aiResponseMetadataRepository.findByCreatedAtBetween(start, end)).thenReturn(List.of(
                aiResponse(false, 250L),
                aiResponse(true, 500L)
        ));

        AnalyticsService service = new AnalyticsService(
                chatMessageRepository,
                escalationRepository,
                aiResponseMetadataRepository,
                analyticsSnapshotRepository,
                Optional.of(new SimpleMeterRegistry())
        );

        AnalyticsSnapshot snapshot = service.aggregate(start, end);

        assertThat(snapshot.getChatVolume()).isEqualTo(2);
        assertThat(snapshot.getAvgResponseTimeMs()).isEqualTo(80.0);
        assertThat(snapshot.getEscalationRate()).isEqualTo(0.5);
        assertThat(snapshot.getFallbackRate()).isEqualTo(0.5);
        assertThat(snapshot.getModelLatencyMs()).isEqualTo(375.0);
        assertThat(snapshot.getSatisfactionScore()).isBetween(1.0, 5.0);
    }

    @Test
    void recordPersistsSnapshot() {
        Instant start = Instant.parse("2026-07-01T00:00:00Z");
        Instant end = Instant.parse("2026-07-02T00:00:00Z");

        when(chatMessageRepository.findByTimestampBetween(start, end)).thenReturn(List.of(message("CUSTOMER", 100L)));
        when(escalationRepository.findByCreatedAtBetween(start, end)).thenReturn(List.of());
        when(aiResponseMetadataRepository.findByCreatedAtBetween(start, end)).thenReturn(List.of());
        when(analyticsSnapshotRepository.save(any(AnalyticsSnapshotEntity.class))).thenAnswer(invocation -> {
            AnalyticsSnapshotEntity entity = invocation.getArgument(0);
            entity.setId(99L);
            return entity;
        });

        AnalyticsService service = new AnalyticsService(
                chatMessageRepository,
                escalationRepository,
                aiResponseMetadataRepository,
                analyticsSnapshotRepository,
                Optional.empty()
        );

        AnalyticsSnapshot snapshot = service.record(start, end);

        assertThat(snapshot.getId()).isEqualTo(99L);
        Mockito.verify(analyticsSnapshotRepository).save(any(AnalyticsSnapshotEntity.class));
    }

    @Test
    void rejectsInvalidPeriod() {
        AnalyticsService service = new AnalyticsService(
                chatMessageRepository,
                escalationRepository,
                aiResponseMetadataRepository,
                analyticsSnapshotRepository,
                Optional.empty()
        );

        assertThatThrownBy(() -> service.aggregate(
                Instant.parse("2026-07-02T00:00:00Z"),
                Instant.parse("2026-07-01T00:00:00Z")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static ChatMessageDocument message(String senderType, Long latencyMs) {
        ChatMessageDocument document = new ChatMessageDocument();
        document.setSenderType(senderType);
        document.setResponseLatencyMs(latencyMs);
        document.setTimestamp(Instant.now());
        return document;
    }

    private static EscalationEntity escalation() {
        EscalationEntity escalation = new EscalationEntity();
        escalation.setTrigger(EscalationTrigger.CUSTOMER_REQUEST);
        escalation.setStatus(EscalationStatus.PENDING);
        return escalation;
    }

    private static AiResponseMetadataDocument aiResponse(boolean fallback, Long latencyMs) {
        AiResponseMetadataDocument document = new AiResponseMetadataDocument();
        document.setCompletionLatencyMs(latencyMs);
        document.setMetadata(Map.of("fallback", fallback));
        document.setCreatedAt(Instant.now());
        return document;
    }
}
