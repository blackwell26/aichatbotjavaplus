package com.company.chatbot.ai;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.rag.RagPromptContext;
import com.company.chatbot.rag.RagRequest;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AiSafetyServiceTest {

    @Test
    void redact_masksSensitiveDataAndInjectionMarkers() {
        AiSafetyService service = new AiSafetyService(new AiSafetyProperties());
        String text = "email john@example.com password=secret 4111 1111 1111 1111 token=abc";

        String redacted = service.redact(text);

        assertThat(redacted).doesNotContain("john@example.com", "secret", "4111 1111 1111 1111", "token=abc");
        assertThat(redacted).contains("[REDACTED]");
    }

    @Test
    void buildPrompt_appliesRedactionAndSystemPrompt() {
        AiSafetyService service = new AiSafetyService(new AiSafetyProperties());
        RagRequest request = new RagRequest(
                "My email is john@example.com and password=secret",
                new CustomerContext("cust-1", "john@example.com", List.of("ROLE_CUSTOMER"), "en-US", Map.of()),
                IntentType.FAQ,
                Map.of("orderNumber", "ORD-1"),
                "Do not expose secrets");
        RagPromptContext context = new RagPromptContext("hash", "Retrieved content with john@example.com", List.of(), List.of(), false, false, null);

        String prompt = service.buildPrompt(request, context, Map.of("customerEmail", "john@example.com"));

        assertThat(prompt).contains("You are a customer-service assistant.");
        assertThat(prompt).doesNotContain("john@example.com", "password=secret");
    }
}
