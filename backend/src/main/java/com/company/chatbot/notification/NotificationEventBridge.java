package com.company.chatbot.notification;

import com.company.chatbot.messaging.EventEnvelope;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationEventBridge {

    public NotificationEvent record(EventEnvelope envelope) {
        NotificationEvent event = new NotificationEvent();
        event.setId(envelope.eventId() == null ? UUID.randomUUID().toString() : envelope.eventId());
        event.setCorrelationId(envelope.correlationId());
        event.setCreatedAt(envelope.timestamp() == null ? Instant.now() : envelope.timestamp());
        event.setPayload(envelope.payload());
        return event;
    }

    public EventEnvelope toEnvelope(NotificationEvent event) {
        return new EventEnvelope(
                event.getId(),
                event.getType() == null ? "notification" : event.getType().name().toLowerCase(),
                event.getCreatedAt(),
                event.getCorrelationId(),
                event.getId(),
                "notification",
                "1",
                Map.copyOf(event.getPayload())
        );
    }
}
