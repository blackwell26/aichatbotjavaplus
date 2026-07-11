package com.company.chatbot.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageDocumentRepository extends MongoRepository<ChatMessageDocument, String> {
    List<ChatMessageDocument> findBySessionIdOrderByTimestampAsc(String sessionId);
}
