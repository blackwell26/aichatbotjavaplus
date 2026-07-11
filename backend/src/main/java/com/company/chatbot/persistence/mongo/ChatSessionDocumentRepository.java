package com.company.chatbot.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionDocumentRepository extends MongoRepository<ChatSessionDocument, String> {
    List<ChatSessionDocument> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<ChatSessionDocument> findByCustomerIdAndStatusOrderByCreatedAtDesc(String customerId, String status);

    Optional<ChatSessionDocument> findByIdAndCustomerId(String id, String customerId);
}
