package com.company.chatbot.messaging;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final MessagingProperties properties;

    public EventPublisher(KafkaTemplate<String, Object> kafkaTemplate, MessagingProperties properties) {
        this.kafkaTemplate = kafkaTemplate;
        this.properties = properties;
    }

    public EventEnvelope publish(String topic, EventEnvelope envelope) {
        kafkaTemplate.send(resolve(topic), envelope.eventId(), envelope);
        return envelope;
    }

    public EventEnvelope publish(String topic, String eventType, Map<String, Object> payload, String correlationId,
                                 String causationId, String tenantId, String payloadVersion) {
        EventEnvelope envelope = new EventEnvelope(
                UUID.randomUUID().toString(),
                eventType,
                Instant.now(),
                correlationId,
                causationId,
                tenantId,
                payloadVersion,
                payload
        );
        return publish(topic, envelope);
    }

    private String resolve(String topic) {
        return properties.getTopicPrefix() + topic;
    }
}
