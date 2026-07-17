package com.company.chatbot.ai;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.KnowledgeSourceType;
import com.company.chatbot.rag.RagCitation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class StructuredAiResponseParser {

    private final ObjectMapper objectMapper;

    public StructuredAiResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public StructuredAiResponse parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Structured AI response must not be blank");
        }
        String json = extractJson(raw);
        try {
            JsonNode node = objectMapper.readTree(json);
            return new StructuredAiResponse(
                    text(node, "responseText"),
                    parseIntent(node.path("intentType").asText(null)),
                    node.path("confidenceScore").asDouble(0.0),
                    parseCitations(node.path("citations")),
                    node.path("escalationRecommended").asBoolean(false),
                    node.has("metadata") && node.get("metadata").isObject()
                            ? objectMapper.convertValue(node.get("metadata"), Map.class)
                            : Map.of()
            );
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid structured AI response", ex);
        }
    }

    private String extractJson(String raw) {
        String trimmed = raw.strip();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start < 0 || end < start) {
            throw new IllegalArgumentException("Structured AI response does not contain JSON");
        }
        return trimmed.substring(start, end + 1);
    }

    private String text(JsonNode node, String field) {
        return node.path(field).asText("");
    }

    private IntentType parseIntent(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return IntentType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return IntentType.UNKNOWN;
        }
    }

    private List<RagCitation> parseCitations(JsonNode node) {
        List<RagCitation> citations = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return citations;
        }
        for (JsonNode citationNode : node) {
            citations.add(new RagCitation(
                    citationNode.path("documentId").asLong(),
                    citationNode.path("chunkId").asLong(),
                    citationNode.path("sourceTitle").asText(null),
                    parseSourceType(citationNode.path("sourceType").asText(null)),
                    citationNode.path("version").asInt(1),
                    citationNode.path("similarity").asDouble(0.0)
            ));
        }
        return citations;
    }

    private KnowledgeSourceType parseSourceType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return KnowledgeSourceType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
