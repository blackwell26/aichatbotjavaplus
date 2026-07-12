package com.company.chatbot.security;

import com.company.chatbot.persistence.redis.TokenBlacklistRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Verifies a JWT token's signature, claims, and revocation state.
 */
@Component
public class JwtTokenVerifier {

    private final JwtService jwtService;
    private final JwtProperties props;
    private TokenBlacklistRepository tokenBlacklistRepository;

    public JwtTokenVerifier(JwtService jwtService, JwtProperties props) {
        this.jwtService = jwtService;
        this.props = props;
    }

    @Autowired(required = false)
    public void setTokenBlacklistRepository(TokenBlacklistRepository tokenBlacklistRepository) {
        this.tokenBlacklistRepository = tokenBlacklistRepository;
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
                    String aud = claims.getAudience();
                    if (aud == null || !aud.equals(props.getAudience())) {
                        return false;
                    }
                } else if (audClaim instanceof List<?> raw) {
                    if (raw.stream().noneMatch(o -> props.getAudience().equals(String.valueOf(o)))) {
                        return false;
                    }
                } else if (!props.getAudience().equals(String.valueOf(audClaim))) {
                    return false;
                }
            }

            String tokenId = claims.getId();
            if (tokenId != null && tokenBlacklistRepository != null
                    && tokenBlacklistRepository.isBlacklisted(tokenId)) {
                return false;
            }

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
