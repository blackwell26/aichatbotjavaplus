package com.company.chatbot.ai;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StructuredAiResponseParserTest {

    private final StructuredAiResponseParser parser =
            new StructuredAiResponseParser(new com.fasterxml.jackson.databind.ObjectMapper());

    @Test
    void parse_readsStructuredJsonWithCodeFences() {
        String raw = """
                ```json
                {
                  "responseText": "Answer",
                  "intentType": "FAQ",
                  "confidenceScore": 0.77,
                  "citations": [],
                  "escalationRecommended": false,
                  "metadata": {"source":"model"}
                }
                ```
                """;

        StructuredAiResponse response = parser.parse(raw);

        assertThat(response.responseText()).isEqualTo("Answer");
        assertThat(response.intentType()).isNotNull();
        assertThat(response.confidenceScore()).isEqualTo(0.77);
        assertThat(response.metadata()).containsEntry("source", "model");
    }

    @Test
    void parse_rejectsMalformedText() {
        assertThatThrownBy(() -> parser.parse("plain text"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
