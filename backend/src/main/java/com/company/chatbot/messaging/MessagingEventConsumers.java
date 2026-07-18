package com.company.chatbot.messaging;

import com.company.chatbot.analytics.AnalyticsService;
import com.company.chatbot.notification.NotificationEvent;
import com.company.chatbot.notification.NotificationEventBridge;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnBean(EventPublisher.class)
public class MessagingEventConsumers {

    private static final Logger log = LoggerFactory.getLogger(MessagingEventConsumers.class);
    private final NotificationEventBridge notificationEventBridge;
    private final AnalyticsService analyticsService;

    public MessagingEventConsumers(NotificationEventBridge notificationEventBridge, AnalyticsService analyticsService) {
        this.notificationEventBridge = notificationEventBridge;
        this.analyticsService = analyticsService;
    }

    @KafkaListener(topics = {EventTopics.NOTIFICATION_REQUESTED})
    public void onNotificationRequested(EventEnvelope envelope) {
        notificationEventBridge.record(envelope);
    }

    @KafkaListener(topics = {EventTopics.ANALYTICS_METRIC_RECORDED})
    public void onAnalyticsMetricRecorded(EventEnvelope envelope) {
        log.debug("analytics event received type={} id={}", envelope.eventType(), envelope.eventId());
        analyticsService.aggregate(envelope.timestamp(), envelope.timestamp().plusSeconds(1));
    }
}
