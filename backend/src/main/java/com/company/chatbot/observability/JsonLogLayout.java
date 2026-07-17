package com.company.chatbot.observability;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.LayoutBase;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

public class JsonLogLayout extends LayoutBase<ILoggingEvent> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String doLayout(ILoggingEvent event) {
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("timestamp", Instant.ofEpochMilli(event.getTimeStamp()).toString());
        json.put("level", event.getLevel().toString());
        json.put("logger", event.getLoggerName());
        json.put("thread", event.getThreadName());
        json.put("message", event.getFormattedMessage());
        json.put("traceId", event.getMDCPropertyMap().get("traceId"));
        json.put("spanId", event.getMDCPropertyMap().get("spanId"));
        json.put("correlationId", event.getMDCPropertyMap().get("correlationId"));
        json.put("requestId", event.getMDCPropertyMap().get("requestId"));
        json.put("sessionId", event.getMDCPropertyMap().get("sessionId"));
        json.put("service", "aichatbotjava");
        json.put("environment", event.getMDCPropertyMap().getOrDefault("environment", "local"));
        try {
            return MAPPER.writeValueAsString(json) + System.lineSeparator();
        } catch (Exception ex) {
            return "{\"message\":\"log serialization failed\"}" + System.lineSeparator();
        }
    }
}
