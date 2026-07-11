package com.company.chatbot.persistence.postgres;

import com.company.chatbot.persistence.postgres.entity.AnalyticsSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshotEntity, Long> {
    List<AnalyticsSnapshotEntity> findByRecordedAtBetween(Instant start, Instant end);
}
