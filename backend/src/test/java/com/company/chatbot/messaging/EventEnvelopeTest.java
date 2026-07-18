package com.company.chatbot.messaging;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EventEnvelopeTest {

    @Test
    void copiesPayloadAndPreservesCoreFields() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderNumber", "ORD-1");

        EventEnvelope envelope = new EventEnvelope(
                "evt-1",
                "order.status.updated",
                Instant.parse("2026-07-18T00:00:00Z"),
                "corr-1",
                "cause-1",
                "tenant-1",
                "1",
                payload
        );

        payload.put("mutated", true);

        assertThat(envelope.eventId()).isEqualTo("evt-1");
        assertThat(envelope.eventType()).isEqualTo("order.status.updated");
        assertThat(envelope.payload()).containsEntry("orderNumber", "ORD-1");
        assertThat(envelope.payload()).doesNotContainKey("mutated");
    }
}
