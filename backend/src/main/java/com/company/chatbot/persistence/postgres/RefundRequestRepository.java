package com.company.chatbot.persistence.postgres;

import com.company.chatbot.common.enums.RefundRequestStatus;
import com.company.chatbot.persistence.postgres.entity.RefundRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefundRequestRepository extends JpaRepository<RefundRequestEntity, Long> {
    Optional<RefundRequestEntity> findByOrderNumber(String orderNumber);

    List<RefundRequestEntity> findByCustomerId(String customerId);

    List<RefundRequestEntity> findByStatus(RefundRequestStatus status);
}
