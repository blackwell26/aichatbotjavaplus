package com.company.chatbot.persistence.postgres;

import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.persistence.postgres.entity.EscalationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EscalationRepository extends JpaRepository<EscalationEntity, Long> {
    List<EscalationEntity> findBySessionId(String sessionId);

    List<EscalationEntity> findByStatus(EscalationStatus status);

    Optional<EscalationEntity> findFirstBySessionIdOrderByCreatedAtDesc(String sessionId);

    List<EscalationEntity> findByCreatedAtBetween(Instant start, Instant end);
}
