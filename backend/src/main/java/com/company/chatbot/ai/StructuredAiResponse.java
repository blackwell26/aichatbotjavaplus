package com.company.chatbot.ai;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.rag.RagCitation;

import java.util.List;
import java.util.Map;

public record StructuredAiResponse(
        String responseText,
        IntentType intentType,
        double confidenceScore,
        List<RagCitation> citations,
        boolean escalationRecommended,
        Map<String, Object> metadata
) {
}
