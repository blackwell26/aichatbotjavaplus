package com.company.chatbot.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionDocumentRepository extends MongoRepository<ChatSessionDocument, String> {
    List<ChatSessionDocument> findByCustomerIdOrderByCreatedAtDesc(String customerId);
}
