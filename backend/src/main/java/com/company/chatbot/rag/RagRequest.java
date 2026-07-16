package com.company.chatbot.rag;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.context.CustomerContext;

import java.util.Map;

public record RagRequest(
        String question,
        CustomerContext customerContext,
        IntentType intent,
        Map<String, Object> externalFacts,
        String safetyConstraints
) {
}
