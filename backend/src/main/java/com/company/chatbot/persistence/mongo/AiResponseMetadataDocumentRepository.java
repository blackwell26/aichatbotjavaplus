package com.company.chatbot.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiResponseMetadataDocumentRepository extends MongoRepository<AiResponseMetadataDocument, String> {
    Optional<AiResponseMetadataDocument> findByMessageId(String messageId);

    List<AiResponseMetadataDocument> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    List<AiResponseMetadataDocument> findByCreatedAtBetween(Instant start, Instant end);
}
