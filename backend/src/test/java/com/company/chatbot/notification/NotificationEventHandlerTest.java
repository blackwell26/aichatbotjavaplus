package com.company.chatbot.notification;

import com.company.chatbot.messaging.EventEnvelope;
import com.company.chatbot.messaging.EventPublisher;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class NotificationEventHandlerTest {

    @Test
    void handlesNotificationRequestedEnvelope() {
        EventPublisher publisher = Mockito.mock(EventPublisher.class);
        NotificationEventBridge bridge = Mockito.mock(NotificationEventBridge.class);
        NotificationAdapter adapter = new InternalNotificationAdapter();
        NotificationEvent event = new NotificationEvent("evt-3", null, null, null, Map.of("recipientId", "cust-3"),
                "corr-3", Instant.parse("2026-07-18T00:00:00Z"));
        when(bridge.record(Mockito.any())).thenReturn(event);

        NotificationService service = new NotificationService(publisher, bridge, List.of(adapter));
        NotificationEventHandler handler = new NotificationEventHandler(service);

        NotificationEvent result = handler.handle(new EventEnvelope(
                "evt-3",
                "order.shipped",
                Instant.parse("2026-07-18T00:00:00Z"),
                "corr-3",
                "cause-3",
                "tenant-1",
                "1",
                Map.of("recipientId", "cust-3", "orderNumber", "ORD-3")
        ));

        assertThat(result.getStatus()).isNotNull();
        assertThat(result.getPayload()).containsEntry("recipientId", "cust-3");
    }
}
