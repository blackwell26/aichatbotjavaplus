package com.company.chatbot.notification;

import com.company.chatbot.common.enums.NotificationStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class InternalNotificationAdapter implements NotificationAdapter {

    private static final Logger log = LoggerFactory.getLogger(InternalNotificationAdapter.class);

    @Override
    public boolean supports(NotificationEvent event) {
        return event != null;
    }

    @Override
    public NotificationEvent send(NotificationEvent event) {
        log.info("notification dispatched type={} recipientId={} correlationId={}",
                event.getType(), event.getRecipientId(), event.getCorrelationId());
        event.setStatus(NotificationStatus.SENT);
        return event;
    }
}
