package com.company.chatbot.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceExtraTest {

    @Test
    public void parseRolesFromCommaSeparatedString() {
        String secret = "extra-test-secret-long-enough-to-be-safe-0123456789";
        JwtService jwtService = new JwtService(secret);
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .setSubject("carol")
                .claim("roles", "CUSTOMER,AGENT")
                .signWith(key)
                .compact();

        List<String> roles = jwtService.getRoles(token);
        assertEquals(List.of("CUSTOMER", "AGENT"), roles);
    }

    @Test
    public void parseRolesFromScopeClaim() {
        String secret = "extra-test-secret-long-enough-to-be-safe-9876543210";
        JwtService jwtService = new JwtService(secret);
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .setSubject("dave")
                .claim("scope", "CUSTOMER AGENT")
                .signWith(key)
                .compact();

        List<String> roles = jwtService.getRoles(token);
        assertEquals(List.of("CUSTOMER", "AGENT"), roles);
    }

    @Test
    public void missingRolesReturnsEmptyList() {
        String secret = "missing-roles-secret-0123456789-abcdef";
        JwtService jwtService = new JwtService(secret);
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .setSubject("erin")
                .signWith(key)
                .compact();

        List<String> roles = jwtService.getRoles(token);
        assertTrue(roles.isEmpty());
    }

    @Test
    public void expiredTokenIsInvalid() {
        String secret = "exp-test-secret-long-enough-000000000000";
        JwtService jwtService = new JwtService(secret);
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        Date past = Date.from(Instant.now().minusSeconds(3600));

        String token = Jwts.builder()
                .setSubject("frank")
                .setExpiration(past)
                .signWith(key)
                .compact();

        assertFalse(jwtService.validateToken(token), "Expired token should be invalid");
    }
}
