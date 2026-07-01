package com.company.chatbot.chat;

import com.company.chatbot.context.CustomerContext;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class ChatSessionService {

    private final ChatSessionRepository repository;

    public ChatSessionService(ChatSessionRepository repository) {
        this.repository = repository;
    }

    /**
     * Create a new chat session for the given customer context.
     * Returns the persisted ChatSession.
     */
    public ChatSession createSession(CustomerContext customerContext, Map<String, Object> metadata) {
        String id = UUID.randomUUID().toString();
        String customerId = customerContext != null ? customerContext.getCustomerId() : null;
        ChatSession session = new ChatSession(id, customerId, "OPEN", Instant.now(), metadata);
        return repository.save(session);
    }
}
