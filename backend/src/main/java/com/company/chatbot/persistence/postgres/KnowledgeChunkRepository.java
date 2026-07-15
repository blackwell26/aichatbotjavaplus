package com.company.chatbot.persistence.postgres;

import com.company.chatbot.persistence.postgres.entity.KnowledgeChunkEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunkEntity, Long> {
    List<KnowledgeChunkEntity> findByDocumentIdOrderBySequenceAsc(Long documentId);

    void deleteByDocumentId(Long documentId);
}
