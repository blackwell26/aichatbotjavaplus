package com.company.chatbot.ai;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.rag.RagCitation;

import java.util.List;
import java.util.Map;

public record OllamaAiRequest(
        String sessionId,
        String messageId,
        String prompt,
        IntentType intentType,
        List<RagCitation> citations,
        Map<String, Object> metadata
) {
}
