package com.company.chatbot.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenVerifierTest {

    @Test
    public void validate_withIssuerAndAudience() {
        String secret = "verifier-secret-long-enough-0123456789-verify";
        JwtProperties props = new JwtProperties();
        props.setSecret(secret);
        props.setRequireIssuer(true);
        props.setIssuer("test-issuer");
        props.setRequireAudience(true);
        props.setAudience("test-aud");

        JwtService service = new JwtService(secret);
        JwtTokenVerifier verifier = new JwtTokenVerifier(service, props);

        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject("guy")
                .setIssuer("test-issuer")
                .setAudience("test-aud")
                .signWith(key)
                .compact();

        assertTrue(verifier.validate(token));
    }

    @Test
    public void validate_failsOnBadIssuer() {
        String secret = "verifier-secret-long-enough-0123456789-verify";
        JwtProperties props = new JwtProperties();
        props.setSecret(secret);
        props.setRequireIssuer(true);
        props.setIssuer("expected-issuer");

        JwtService service = new JwtService(secret);
        JwtTokenVerifier verifier = new JwtTokenVerifier(service, props);

        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject("hank")
                .setIssuer("other-issuer")
                .signWith(key)
                .compact();

        assertFalse(verifier.validate(token));
    }

    @Test
    public void validate_failsOnBadAudience() {
        String secret = "verifier-secret-long-enough-0123456789-verify";
        JwtProperties props = new JwtProperties();
        props.setSecret(secret);
        props.setRequireAudience(true);
        props.setAudience("expected-aud");

        JwtService service = new JwtService(secret);
        JwtTokenVerifier verifier = new JwtTokenVerifier(service, props);

        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject("ida")
                .setAudience("different-aud")
                .signWith(key)
                .compact();

        assertFalse(verifier.validate(token));
    }

    @Test
    public void validate_allowsClockSkew() {
        String secret = "verifier-secret-long-enough-0123456789-verify";
        JwtProperties props = new JwtProperties();
        props.setSecret(secret);
        props.setAllowedClockSkewSeconds(120);

        JwtService service = new JwtService(secret);
        JwtTokenVerifier verifier = new JwtTokenVerifier(service, props);

        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Date exp = Date.from(Instant.now().minusSeconds(30)); // expired 30s ago
        String token = Jwts.builder()
                .setSubject("jane")
                .setExpiration(exp)
                .signWith(key)
                .compact();

        // allowedClockSkewSeconds is 120, so token expired 30s ago should be accepted
        assertTrue(verifier.validate(token));
    }

    @Test
    public void validate_rejectsBlacklistedToken() {
        String secret = "verifier-secret-long-enough-0123456789-verify";
        JwtProperties props = new JwtProperties();
        props.setSecret(secret);

        JwtService service = new JwtService(secret);
        JwtTokenVerifier verifier = new JwtTokenVerifier(service, props);
        com.company.chatbot.persistence.redis.TokenBlacklistRepository blacklistRepository =
                org.mockito.Mockito.mock(com.company.chatbot.persistence.redis.TokenBlacklistRepository.class);
        org.mockito.Mockito.when(blacklistRepository.isBlacklisted("token-1")).thenReturn(true);
        verifier.setTokenBlacklistRepository(blacklistRepository);

        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject("kay")
                .setId("token-1")
                .signWith(key)
                .compact();

        assertFalse(verifier.validate(token));
    }
}
