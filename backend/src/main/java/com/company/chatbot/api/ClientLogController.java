package com.company.chatbot.api;

import com.company.chatbot.api.dto.ClientLogRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/client-logs")
public class ClientLogController {

    private static final Logger log = LoggerFactory.getLogger(ClientLogController.class);

    @PostMapping
    public ResponseEntity<Void> ingest(@Valid @RequestBody ClientLogRequest request) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable("source", "frontend")) {
            log.info(
                "client-log level={} source={} url={} sessionId={} message={} stack={} userAgent={}",
                request.getLevel(),
                request.getSource(),
                request.getUrl(),
                request.getSessionId(),
                request.getMessage(),
                request.getStack(),
                request.getUserAgent()
            );
        }
        return ResponseEntity.accepted().build();
    }
}
