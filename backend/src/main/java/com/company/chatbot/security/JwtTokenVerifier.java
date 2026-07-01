package com.company.chatbot.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Verifies a JWT token's signature and common claims (iss, aud, exp) using JwtService for parsing.
 */
@Component
public class JwtTokenVerifier {

    private final JwtService jwtService;
    private final JwtProperties props;

    public JwtTokenVerifier(JwtService jwtService, JwtProperties props) {
        this.jwtService = jwtService;
        this.props = props;
    }

    /**
     * Validate token signature and claims. Returns true if valid, false otherwise.
     */
    public boolean validate(String token) {
        try {
            Jws<Claims> jws = jwtService.parseJws(token, props.getAllowedClockSkewSeconds());
            Claims claims = jws.getBody();

            if (props.isRequireIssuer()) {
                String iss = claims.getIssuer();
                if (props.getIssuer() == null || !props.getIssuer().equals(iss)) {
                    return false;
                }
            }

            if (props.isRequireAudience()) {
                Object audClaim = claims.get("aud");
                if (audClaim == null) {
                    // also try standard claim
                    String aud = claims.getAudience();
                    if (aud == null || !aud.equals(props.getAudience())) return false;
                } else {
                    if (audClaim instanceof List) {
                        List<?> raw = (List<?>) audClaim;
                        if (raw.stream().noneMatch(o -> props.getAudience().equals(String.valueOf(o)))) return false;
                    } else {
                        if (!props.getAudience().equals(String.valueOf(audClaim))) return false;
                    }
                }
            }

            // Additional verifications (revocation, jti checks) could go here.
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    /**
     * Validate token and throw JwtException on failure.
     */
    public void verifyOrThrow(String token) {
        if (!validate(token)) {
            throw new JwtException("JWT verification failed");
        }
    }
}
