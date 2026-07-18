package com.company.chatbot.notification;

import com.company.chatbot.common.enums.NotificationStatus;
import com.company.chatbot.common.enums.NotificationType;
import com.company.chatbot.messaging.EventEnvelope;
import com.company.chatbot.messaging.EventPublisher;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationServiceTest {

    @Test
    void createsAndPublishesShippedNotification() {
        EventPublisher publisher = Mockito.mock(EventPublisher.class);
        NotificationEventBridge bridge = Mockito.mock(NotificationEventBridge.class);
        NotificationAdapter adapter = new InternalNotificationAdapter();
        NotificationEvent bridged = new NotificationEvent("evt-1", NotificationType.ORDER_SHIPPED,
                NotificationStatus.PENDING, "cust-1", Map.of("orderNumber", "ORD-1"), "corr-1",
                Instant.parse("2026-07-18T00:00:00Z"));
        when(bridge.toEnvelope(any())).thenReturn(new EventEnvelope(
                "evt-1", "notification.requested", Instant.parse("2026-07-18T00:00:00Z"),
                "corr-1", "evt-1", "notification", "1", Map.of("recipientId", "cust-1")));
        when(publisher.publish(any(), any(EventEnvelope.class))).thenAnswer(invocation -> invocation.getArgument(1));

        NotificationService service = new NotificationService(publisher, bridge, List.of(adapter));
        NotificationEvent result = service.orderShipped("cust-1", "ORD-1", "TRACK-1", "UPS", "corr-1");

        ArgumentCaptor<NotificationEvent> captor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(bridge).toEnvelope(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(NotificationType.ORDER_SHIPPED);
        assertThat(captor.getValue().getRecipientId()).isEqualTo("cust-1");
        assertThat(result.getStatus()).isEqualTo(NotificationStatus.SENT);
        assertThat(result.getPayload()).containsEntry("trackingNumber", "TRACK-1");
    }

    @Test
    void dispatchFallsBackToFailedWhenNoAdapterSupportsEvent() {
        EventPublisher publisher = Mockito.mock(EventPublisher.class);
        NotificationEventBridge bridge = Mockito.mock(NotificationEventBridge.class);
        NotificationAdapter adapter = new NotificationAdapter() {
            @Override
            public boolean supports(NotificationEvent event) {
                return false;
            }

            @Override
            public NotificationEvent send(NotificationEvent event) {
                return event;
            }
        };

        NotificationService service = new NotificationService(publisher, bridge, List.of(adapter));
        NotificationEvent event = new NotificationEvent("evt-2", NotificationType.ESCALATION_UPDATE,
                NotificationStatus.PENDING, "cust-2", Map.of("status", "OPEN"), "corr-2",
                Instant.parse("2026-07-18T00:00:00Z"));

        NotificationEvent result = service.dispatch(event);

        assertThat(result.getStatus()).isEqualTo(NotificationStatus.FAILED);
    }
}
