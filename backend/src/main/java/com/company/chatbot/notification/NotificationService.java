package com.company.chatbot.notification;

import com.company.chatbot.common.enums.NotificationStatus;
import com.company.chatbot.common.enums.NotificationType;
import com.company.chatbot.messaging.EventEnvelope;
import com.company.chatbot.messaging.EventPublisher;
import com.company.chatbot.messaging.EventTopics;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnBean(EventPublisher.class)
public class NotificationService {

    private final EventPublisher eventPublisher;
    private final NotificationEventBridge eventBridge;
    private final List<NotificationAdapter> adapters;

    public NotificationService(EventPublisher eventPublisher,
                               NotificationEventBridge eventBridge,
                               List<NotificationAdapter> adapters) {
        this.eventPublisher = eventPublisher;
        this.eventBridge = eventBridge;
        this.adapters = adapters;
    }

    public NotificationEvent create(NotificationType type, String recipientId, Map<String, Object> payload,
                                     String correlationId) {
        NotificationEvent event = new NotificationEvent(
                UUID.randomUUID().toString(),
                type,
                NotificationStatus.PENDING,
                recipientId,
                payload == null ? Map.of() : new LinkedHashMap<>(payload),
                correlationId,
                Instant.now()
        );
        publish(event);
        return dispatch(event);
    }

    public NotificationEvent orderShipped(String recipientId, String orderNumber, String trackingNumber,
                                          String carrier, String correlationId) {
        return create(NotificationType.ORDER_SHIPPED, recipientId, payload(
                "orderNumber", orderNumber,
                "trackingNumber", trackingNumber,
                "carrier", carrier
        ), correlationId);
    }

    public NotificationEvent refundApproved(String recipientId, String orderNumber, String refundRequestId,
                                            String correlationId) {
        return create(NotificationType.REFUND_APPROVED, recipientId, payload(
                "orderNumber", orderNumber,
                "refundRequestId", refundRequestId
        ), correlationId);
    }

    public NotificationEvent ticketAssigned(String recipientId, String ticketId, String agentId,
                                            String correlationId) {
        return create(NotificationType.TICKET_ASSIGNED, recipientId, payload(
                "ticketId", ticketId,
                "agentId", agentId
        ), correlationId);
    }

    public NotificationEvent escalationUpdate(String recipientId, String escalationId, String status,
                                              String correlationId) {
        return create(NotificationType.ESCALATION_UPDATE, recipientId, payload(
                "escalationId", escalationId,
                "status", status
        ), correlationId);
    }

    public NotificationEvent fromEnvelope(EventEnvelope envelope) {
        NotificationEvent event = eventBridge.record(envelope);
        return dispatch(event);
    }

    public EventEnvelope publish(NotificationEvent event) {
        EventEnvelope envelope = eventBridge.toEnvelope(event);
        return eventPublisher.publish(EventTopics.NOTIFICATION_REQUESTED, envelope);
    }

    public NotificationEvent dispatch(NotificationEvent event) {
        for (NotificationAdapter adapter : adapters) {
            if (adapter.supports(event)) {
                return adapter.send(event);
            }
        }
        event.setStatus(NotificationStatus.FAILED);
        return event;
    }

    private static Map<String, Object> payload(Object... pairs) {
        Map<String, Object> payload = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            payload.put(String.valueOf(pairs[i]), pairs[i + 1]);
        }
        return payload;
    }
}
