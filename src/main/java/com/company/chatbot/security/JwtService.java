package com.company.chatbot.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {

    private final Key signingKey;

    public JwtService(@Value("${security.jwt.secret:local-dev-secret-change-in-prod}") String secret) {
        // Use the configured secret as HMAC SHA key. In production, ensure the secret is sufficiently long.
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getSubject(String token) {
        Jws<Claims> jws = Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token);
        return jws.getBody().getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        Jws<Claims> jws = Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token);
        Claims claims = jws.getBody();

        Object rolesClaim = claims.get("roles");
        if (rolesClaim instanceof List) {
            List<?> raw = (List<?>) rolesClaim;
            List<String> roles = new ArrayList<>();
            for (Object o : raw) {
                roles.add(String.valueOf(o));
            }
            return roles;
        }

        if (rolesClaim instanceof String) {
            String s = (String) rolesClaim;
            if (s.isBlank()) return List.of();
            return Arrays.stream(s.split(","))
                    .map(String::trim)
                    .filter(r -> !r.isEmpty())
                    .toList();
        }

        // Fallback to 'scope' or 'authorities' claims if present
        Object scope = claims.get("scope");
        if (scope instanceof String) {
            return Arrays.stream(((String) scope).split(" "))
                    .map(String::trim)
                    .filter(r -> !r.isEmpty())
                    .toList();
        }

        return List.of();
    }
}
