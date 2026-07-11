package com.company.chatbot.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationSummaryDocumentRepository extends MongoRepository<ConversationSummaryDocument, String> {
    Optional<ConversationSummaryDocument> findBySessionId(String sessionId);

    List<ConversationSummaryDocument> findByCustomerIdOrderByCreatedAtDesc(String customerId);
}
