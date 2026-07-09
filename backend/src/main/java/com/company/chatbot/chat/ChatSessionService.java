package com.company.chatbot.chat;

import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.persistence.mongo.ChatSessionDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatSessionMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatSessionService {

    private final ChatSessionDocumentRepository repository;

    public ChatSessionService(ChatSessionDocumentRepository repository) {
        this.repository = repository;
    }

    /**
     * Create a new chat session for the given customer context.
     * Returns the persisted ChatSession.
     */
    public ChatSession createSession(CustomerContext customerContext, Map<String, Object> metadata) {
        String id = UUID.randomUUID().toString();
        String customerId = customerContext != null ? customerContext.getCustomerId() : null;
        Instant now = Instant.now();
        ChatSession session = new ChatSession(
                id,
                customerId,
                ChatSessionStatus.OPEN,
                null,
                null,
                now,
                now,
                null,
                metadata
        );
        return ChatSessionMapper.toDomain(repository.save(ChatSessionMapper.toDocument(session)));
    }

    public List<ChatSession> findByCustomerId(String customerId) {
        return repository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(ChatSessionMapper::toDomain)
                .collect(Collectors.toList());
    }
}
