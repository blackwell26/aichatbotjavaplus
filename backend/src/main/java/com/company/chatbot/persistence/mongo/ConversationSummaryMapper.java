package com.company.chatbot.persistence.mongo;

import com.company.chatbot.chat.ConversationSummary;

public final class ConversationSummaryMapper {

    private ConversationSummaryMapper() {}

    public static ConversationSummary toDomain(ConversationSummaryDocument document) {
        if (document == null) {
            return null;
        }
        return new ConversationSummary(
                document.getId(),
                document.getSessionId(),
                document.getCustomerId(),
                document.getSummaryText(),
                document.getMessageCount(),
                document.getKeyTopics(),
                document.getCreatedAt(),
                document.getUpdatedAt(),
                document.getMetadata()
        );
    }

    public static ConversationSummaryDocument toDocument(ConversationSummary summary) {
        if (summary == null) {
            return null;
        }
        ConversationSummaryDocument document = new ConversationSummaryDocument();
        document.setId(summary.getId());
        document.setSessionId(summary.getSessionId());
        document.setCustomerId(summary.getCustomerId());
        document.setSummaryText(summary.getSummaryText());
        document.setMessageCount(summary.getMessageCount());
        document.setKeyTopics(summary.getKeyTopics());
        document.setCreatedAt(summary.getCreatedAt());
        document.setUpdatedAt(summary.getUpdatedAt());
        document.setMetadata(summary.getMetadata());
        return document;
    }
}
