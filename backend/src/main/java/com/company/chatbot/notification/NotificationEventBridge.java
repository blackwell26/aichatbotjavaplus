package com.company.chatbot.notification;

import com.company.chatbot.messaging.EventEnvelope;
import com.company.chatbot.common.enums.NotificationStatus;
import com.company.chatbot.common.enums.NotificationType;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationEventBridge {

    public NotificationEvent record(EventEnvelope envelope) {
        NotificationEvent event = new NotificationEvent();
        event.setId(envelope.eventId() == null ? UUID.randomUUID().toString() : envelope.eventId());
        event.setType(resolveType(envelope.eventType()));
        event.setStatus(NotificationStatus.PENDING);
        event.setRecipientId(stringValue(envelope.payload().get("recipientId")));
        event.setCorrelationId(envelope.correlationId());
        event.setCreatedAt(envelope.timestamp() == null ? Instant.now() : envelope.timestamp());
        event.setPayload(envelope.payload());
        return event;
    }

    public EventEnvelope toEnvelope(NotificationEvent event) {
        return new EventEnvelope(
                event.getId(),
                event.getType() == null ? "notification.requested" : event.getType().name().toLowerCase(),
                event.getCreatedAt(),
                event.getCorrelationId(),
                event.getId(),
                "notification",
                "1",
                Map.copyOf(event.getPayload())
        );
    }

    private static NotificationType resolveType(String eventType) {
        if (eventType == null) {
            return NotificationType.ESCALATION_UPDATE;
        }
        return switch (eventType.toLowerCase()) {
            case "order.shipped", "order_shipped" -> NotificationType.ORDER_SHIPPED;
            case "refund.approved", "refund_approved" -> NotificationType.REFUND_APPROVED;
            case "ticket.assigned", "ticket_assigned" -> NotificationType.TICKET_ASSIGNED;
            default -> NotificationType.ESCALATION_UPDATE;
        };
    }

    private static String stringValue(Object value) {
        return value == null ? null : value.toString();
    }
}
