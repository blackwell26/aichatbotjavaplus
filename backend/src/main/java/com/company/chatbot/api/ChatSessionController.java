package com.company.chatbot.api;

import com.company.chatbot.api.dto.ChatSessionDto;
import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.chat.ChatSessionService;
import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/sessions")
@Validated
public class ChatSessionController {

    private final ChatSessionService sessionService;

    public ChatSessionController(ChatSessionService sessionService) {
        this.sessionService = sessionService;
    }

    public static class CreateRequest {
        public Map<String, Object> metadata;

        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    @PostMapping
    public ResponseEntity<ChatSessionDto> createSession(@CurrentCustomer CustomerContext customer,
                                                         @RequestBody(required = false) CreateRequest request) {
        ChatSession session = sessionService.createSession(customer, request != null ? request.getMetadata() : Map.of());
        ChatSessionDto dto = new ChatSessionDto(
                session.getId(),
                session.getCustomerId(),
                session.getStatus().name(),
                session.getCreatedAt()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
