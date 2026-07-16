package com.company.chatbot.ai;

import com.company.chatbot.chat.AiResponseMetadata;

public record OllamaAiResponse(
        String responseText,
        AiResponseMetadata metadata,
        boolean fallback
) {
}
