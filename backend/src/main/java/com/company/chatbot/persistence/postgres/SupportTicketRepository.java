package com.company.chatbot.persistence.postgres;

import com.company.chatbot.common.enums.TicketStatus;
import com.company.chatbot.persistence.postgres.entity.SupportTicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicketEntity, Long> {
    List<SupportTicketEntity> findByCustomerId(Long customerId);

    List<SupportTicketEntity> findByStatus(TicketStatus status);
}
