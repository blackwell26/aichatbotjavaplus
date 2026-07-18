package com.company.chatbot.notification;

public interface NotificationAdapter {
    boolean supports(NotificationEvent event);

    NotificationEvent send(NotificationEvent event);
}
