package com.company.chatbot.common.enums;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DomainEnumsTest {

    @Test
    void userRoleParsesRolePrefix() {
        assertTrue(UserRole.fromAuthority("ROLE_AGENT").isPresent());
        assertEquals(UserRole.AGENT, UserRole.fromAuthority("ROLE_AGENT").orElseThrow());
    }

    @Test
    void confidenceLevelMapsFromScore() {
        assertEquals(ConfidenceLevel.HIGH, ConfidenceLevel.fromScore(0.9));
        assertEquals(ConfidenceLevel.MEDIUM, ConfidenceLevel.fromScore(0.6));
        assertEquals(ConfidenceLevel.LOW, ConfidenceLevel.fromScore(0.2));
    }
}
