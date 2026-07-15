package com.company.chatbot.persistence.postgres;

import com.company.chatbot.persistence.postgres.entity.KnowledgeDocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocumentEntity, Long> {
    long countByStatus(String status);
}
