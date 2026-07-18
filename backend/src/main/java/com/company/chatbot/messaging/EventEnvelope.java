package com.company.chatbot.messaging;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

public record EventEnvelope(
        String eventId,
        String eventType,
        Instant timestamp,
        String correlationId,
        String causationId,
        String tenantId,
        String payloadVersion,
        Map<String, Object> payload) {

    public EventEnvelope {
        payload = payload == null ? Map.of() : Map.copyOf(new LinkedHashMap<>(payload));
    }
}
