package com.company.chatbot.notification;

import com.company.chatbot.messaging.EventEnvelope;
import com.company.chatbot.messaging.EventTopics;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnBean(NotificationService.class)
public class NotificationEventHandler {

    private final NotificationService notificationService;

    public NotificationEventHandler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = {EventTopics.NOTIFICATION_REQUESTED})
    public NotificationEvent handle(EventEnvelope envelope) {
        return notificationService.fromEnvelope(envelope);
    }
}
