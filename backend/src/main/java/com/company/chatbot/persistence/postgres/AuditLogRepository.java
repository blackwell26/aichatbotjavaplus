package com.company.chatbot.persistence.postgres;

import com.company.chatbot.persistence.postgres.entity.AuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
    List<AuditLogEntity> findByActorId(String actorId);

    List<AuditLogEntity> findByLoggedAtBetween(Instant start, Instant end);
}
