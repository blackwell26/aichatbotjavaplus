package com.company.chatbot.persistence.postgres;

import com.company.chatbot.persistence.postgres.entity.TicketCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketCommentRepository extends JpaRepository<TicketCommentEntity, Long> {
    List<TicketCommentEntity> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
