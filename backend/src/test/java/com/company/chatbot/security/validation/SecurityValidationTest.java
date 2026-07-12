package com.company.chatbot.security.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityValidationTest {

    @Test
    void validatesSessionAndOrderIds() {
        assertEquals("session-1", IdValidator.requireValidSessionId("session-1"));
        assertEquals("ORD-123", IdValidator.requireValidOrderNumber("ORD-123"));
        assertThrows(IllegalArgumentException.class, () -> IdValidator.requireValidSessionId("../bad"));
    }

    @Test
    void validatesChatMessages() {
        assertEquals("hello", ChatMessageValidator.validate(" hello "));
        assertThrows(IllegalArgumentException.class, () -> ChatMessageValidator.validate(" "));
        assertThrows(IllegalArgumentException.class,
                () -> ChatMessageValidator.validate("x".repeat(ChatMessageValidator.MAX_MESSAGE_LENGTH + 1)));
    }

    @Test
    void validatesFileUploads() {
        FileUploadValidator.validate("policy.pdf", "application/pdf", 1024);
        assertThrows(IllegalArgumentException.class,
                () -> FileUploadValidator.validate("policy.exe", "application/octet-stream", 1024));
    }

    @Test
    void validatesWorkflowRequests() {
        WorkflowRequestValidator.validateRefundRequest("ORD-100", "Damaged item");
        WorkflowRequestValidator.validateEscalationRequest("session-1", "Need human help");
        assertThrows(IllegalArgumentException.class,
                () -> WorkflowRequestValidator.validateRefundRequest("bad order", "reason"));
    }
}
