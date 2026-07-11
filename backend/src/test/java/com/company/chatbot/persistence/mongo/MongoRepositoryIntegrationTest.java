package com.company.chatbot.persistence.mongo;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.MessageSenderType;
import com.company.chatbot.config.MongoConfig;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataMongoTest
@Import(MongoConfig.class)
@Testcontainers
@TestPropertySource(properties = {
        "persistence.mongo.enabled=true",
        "persistence.postgres.enabled=false",
        "spring.data.mongodb.auto-index-creation=true"
})
@EnabledIf("com.company.chatbot.persistence.postgres.support.DockerConditions#dockerAvailable")
class MongoRepositoryIntegrationTest {

    @Container
    static final MongoDBContainer MONGO = new MongoDBContainer("mongo:7.0");

    @DynamicPropertySource
    static void configureMongo(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", MONGO::getConnectionString);
    }

    @Autowired
    private ChatSessionDocumentRepository chatSessionDocumentRepository;

    @Autowired
    private ChatMessageDocumentRepository chatMessageDocumentRepository;

    @Autowired
    private ConversationSummaryDocumentRepository conversationSummaryDocumentRepository;

    @Autowired
    private AiResponseMetadataDocumentRepository aiResponseMetadataDocumentRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void persistsConversationDocumentsAndCreatesIndexes() {
        Instant now = Instant.parse("2026-07-10T12:00:00Z");

        ChatSessionDocument session = new ChatSessionDocument();
        session.setId("session-1");
        session.setCustomerId("customer-1");
        session.setStatus("ACTIVE");
        session.setChannel("web");
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        session.setMetadata(Map.of("locale", "en-US"));
        chatSessionDocumentRepository.save(session);

        ChatMessageDocument customerMessage = new ChatMessageDocument();
        customerMessage.setId("msg-1");
        customerMessage.setSessionId("session-1");
        customerMessage.setSenderType(MessageSenderType.CUSTOMER.name());
        customerMessage.setContent("Where is my order?");
        customerMessage.setTimestamp(now);
        customerMessage.setIntentType(IntentType.ORDER_STATUS.name());
        chatMessageDocumentRepository.save(customerMessage);

        ChatMessageDocument aiMessage = new ChatMessageDocument();
        aiMessage.setId("msg-2");
        aiMessage.setSessionId("session-1");
        aiMessage.setSenderType(MessageSenderType.AI.name());
        aiMessage.setContent("Your order is on the way.");
        aiMessage.setTimestamp(now.plusSeconds(2));
        aiMessage.setIntentType(IntentType.ORDER_STATUS.name());
        aiMessage.setConfidenceLevel(ConfidenceLevel.HIGH.name());
        aiMessage.setConfidenceScore(0.92);
        aiMessage.setResponseLatencyMs(850L);
        chatMessageDocumentRepository.save(aiMessage);

        ConversationSummaryDocument summary = new ConversationSummaryDocument();
        summary.setId("summary-1");
        summary.setSessionId("session-1");
        summary.setCustomerId("customer-1");
        summary.setSummaryText("Customer asked about order status.");
        summary.setMessageCount(2);
        summary.setKeyTopics(List.of("order", "shipping"));
        summary.setCreatedAt(now);
        summary.setUpdatedAt(now.plusSeconds(2));
        conversationSummaryDocumentRepository.save(summary);

        AiResponseMetadataDocument aiMetadata = new AiResponseMetadataDocument();
        aiMetadata.setId("ai-meta-1");
        aiMetadata.setSessionId("session-1");
        aiMetadata.setMessageId("msg-2");
        aiMetadata.setResponseText("Your order is on the way.");
        aiMetadata.setIntentType(IntentType.ORDER_STATUS.name());
        aiMetadata.setConfidenceLevel(ConfidenceLevel.HIGH.name());
        aiMetadata.setConfidenceScore(0.92);
        aiMetadata.setModelName("llama3");
        aiMetadata.setPromptSize(1024);
        aiMetadata.setCompletionLatencyMs(850L);
        aiMetadata.setCitations(List.of(Map.of(
                "documentId", 10,
                "chunkId", 42,
                "sourceTitle", "Shipping FAQ"
        )));
        aiMetadata.setEscalationRecommended(false);
        aiMetadata.setCreatedAt(now.plusSeconds(2));
        aiResponseMetadataDocumentRepository.save(aiMetadata);

        assertTrue(chatSessionDocumentRepository.findByIdAndCustomerId("session-1", "customer-1").isPresent());
        assertEquals(1, chatSessionDocumentRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(
                "customer-1", "ACTIVE").size());
        assertEquals(2, chatMessageDocumentRepository.findBySessionIdOrderByTimestampAsc("session-1").size());
        assertTrue(conversationSummaryDocumentRepository.findBySessionId("session-1").isPresent());
        assertTrue(aiResponseMetadataDocumentRepository.findByMessageId("msg-2").isPresent());
        assertEquals(1, aiResponseMetadataDocumentRepository.findBySessionIdOrderByCreatedAtAsc("session-1").size());

        assertTrue(hasIndexedField("chat_sessions", "customerId"));
        assertTrue(hasIndexedField("chat_sessions", "status"));
        assertTrue(hasIndexedField("chat_sessions", "createdAt"));
        assertTrue(hasIndexedField("chat_messages", "sessionId"));
        assertTrue(hasIndexedField("chat_messages", "timestamp"));
        assertTrue(hasIndexedField("conversation_summaries", "sessionId"));
        assertTrue(hasIndexedField("conversation_summaries", "customerId"));
        assertTrue(hasIndexedField("ai_response_metadata", "sessionId"));
        assertTrue(hasIndexedField("ai_response_metadata", "messageId"));
    }

    private boolean hasIndexedField(String collection, String fieldName) {
        Set<String> indexedFields = StreamSupport.stream(
                        mongoTemplate.getCollection(collection).listIndexes().spliterator(), false)
                .map(document -> document.get("key", Document.class))
                .flatMap(keyDocument -> keyDocument.keySet().stream())
                .collect(Collectors.toSet());
        return indexedFields.contains(fieldName);
    }
}
