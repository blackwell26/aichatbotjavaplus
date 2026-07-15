package com.company.chatbot.persistence.postgres;

import com.company.chatbot.persistence.postgres.entity.DocumentEmbeddingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentEmbeddingRepository extends JpaRepository<DocumentEmbeddingEntity, Long> {
    List<DocumentEmbeddingEntity> findByDocumentId(Long documentId);

    Optional<DocumentEmbeddingEntity> findByEmbeddingId(String embeddingId);

    void deleteByDocumentId(Long documentId);
}
