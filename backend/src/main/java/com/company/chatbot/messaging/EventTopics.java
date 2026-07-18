package com.company.chatbot.messaging;

public final class EventTopics {
    public static final String CHAT_MESSAGE_RECEIVED = "chat.message.received";
    public static final String RESPONSE_GENERATED = "chat.response.generated";
    public static final String SESSION_CLOSED = "chat.session.closed";
    public static final String ESCALATION_REQUESTED = "chat.escalation.requested";
    public static final String SUPPORT_TICKET_CREATED = "support.ticket.created";
    public static final String ORDER_STATUS_UPDATED = "order.status.updated";
    public static final String REFUND_REQUEST_CREATED = "refund.request.created";
    public static final String REFUND_REQUEST_UPDATED = "refund.request.updated";
    public static final String NOTIFICATION_REQUESTED = "notification.requested";
    public static final String KNOWLEDGE_DOCUMENT_INGESTED = "knowledge.document.ingested";
    public static final String ANALYTICS_METRIC_RECORDED = "analytics.metric.recorded";

    public static final String CHAT_MESSAGE_RECEIVED_DLT = CHAT_MESSAGE_RECEIVED + ".dlt";
    public static final String RESPONSE_GENERATED_DLT = RESPONSE_GENERATED + ".dlt";
    public static final String SESSION_CLOSED_DLT = SESSION_CLOSED + ".dlt";
    public static final String ESCALATION_REQUESTED_DLT = ESCALATION_REQUESTED + ".dlt";
    public static final String SUPPORT_TICKET_CREATED_DLT = SUPPORT_TICKET_CREATED + ".dlt";
    public static final String ORDER_STATUS_UPDATED_DLT = ORDER_STATUS_UPDATED + ".dlt";
    public static final String REFUND_REQUEST_CREATED_DLT = REFUND_REQUEST_CREATED + ".dlt";
    public static final String REFUND_REQUEST_UPDATED_DLT = REFUND_REQUEST_UPDATED + ".dlt";
    public static final String NOTIFICATION_REQUESTED_DLT = NOTIFICATION_REQUESTED + ".dlt";
    public static final String KNOWLEDGE_DOCUMENT_INGESTED_DLT = KNOWLEDGE_DOCUMENT_INGESTED + ".dlt";
    public static final String ANALYTICS_METRIC_RECORDED_DLT = ANALYTICS_METRIC_RECORDED + ".dlt";

    private EventTopics() {}
}
