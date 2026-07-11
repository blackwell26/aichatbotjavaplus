package com.company.chatbot.persistence.mongo;

import com.company.chatbot.chat.AiResponseMetadata;
import com.company.chatbot.chat.ChatMessage;
import com.company.chatbot.chat.ConversationSummary;
import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.MessageSenderType;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class MongoMapperTest {

    @Test
    void roundTripsChatMessage() {
        Instant now = Instant.parse("2026-07-10T12:00:00Z");
        ChatMessage message = new ChatMessage(
                "msg-1",
                "session-1",
                MessageSenderType.AI,
                "Hello",
                now,
                IntentType.FAQ,
                ConfidenceLevel.HIGH,
                0.95,
                500L,
                false,
                Map.of("channel", "web")
        );

        ChatMessage restored = ChatMessageMapper.toDomain(ChatMessageMapper.toDocument(message));

        assertEquals(message.getId(), restored.getId());
        assertEquals(message.getSenderType(), restored.getSenderType());
        assertEquals(message.getIntentType(), restored.getIntentType());
        assertEquals("web", restored.getMetadata().get("channel"));
    }

    @Test
    void roundTripsConversationSummary() {
        Instant now = Instant.parse("2026-07-10T12:00:00Z");
        ConversationSummary summary = new ConversationSummary(
                "summary-1",
                "session-1",
                "customer-1",
                "Order inquiry",
                3,
                List.of("order"),
                now,
                now,
                Map.of("version", 1)
        );

        ConversationSummary restored = ConversationSummaryMapper.toDomain(
                ConversationSummaryMapper.toDocument(summary));

        assertEquals(summary.getSessionId(), restored.getSessionId());
        assertEquals(3, restored.getMessageCount());
        assertEquals("order", restored.getKeyTopics().getFirst());
    }

    @Test
    void roundTripsAiResponseMetadata() {
        Instant now = Instant.parse("2026-07-10T12:00:00Z");
        AiResponseMetadata metadata = new AiResponseMetadata(
                "meta-1",
                "session-1",
                "msg-2",
                "Your order shipped.",
                IntentType.ORDER_STATUS,
                ConfidenceLevel.HIGH,
                0.91,
                "llama3",
                900,
                700L,
                null,
                List.of(Map.of("sourceTitle", "Shipping FAQ")),
                false,
                now,
                Map.of()
        );

        AiResponseMetadata restored = AiResponseMetadataMapper.toDomain(
                AiResponseMetadataMapper.toDocument(metadata));

        assertEquals(metadata.getMessageId(), restored.getMessageId());
        assertEquals(IntentType.ORDER_STATUS, restored.getIntentType());
        assertFalse(restored.isEscalationRecommended());
        assertEquals("Shipping FAQ", restored.getCitations().getFirst().get("sourceTitle"));
    }
}
