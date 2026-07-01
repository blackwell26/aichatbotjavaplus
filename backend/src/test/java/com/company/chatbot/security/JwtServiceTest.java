package com.company.chatbot.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceTest {

    @Test
    public void validateAndExtractClaims() {
        String secret = "test-secret-that-is-long-enough-for-hmac-sha-256";
        JwtService jwtService = new JwtService(secret);

        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .setSubject("alice")
                .claim("roles", List.of("CUSTOMER", "ADMIN"))
                .signWith(key)
                .compact();

        assertTrue(jwtService.validateToken(token), "Token should be valid");
        assertEquals("alice", jwtService.getSubject(token));
        assertEquals(List.of("CUSTOMER", "ADMIN"), jwtService.getRoles(token));
    }

    @Test
    public void invalidTokenIsRejected() {
        String secret = "another-test-secret-with-sufficient-length-012345";
        JwtService jwtService = new JwtService(secret);

        // random/malformed token
        assertFalse(jwtService.validateToken("not-a-token"));
    }
}
