package com.company.chatbot.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "security.jwt")
public class JwtProperties {
    private String secret = "local-dev-secret-change-in-prod";
    private String issuer;
    private String audience;
    private boolean requireIssuer = false;
    private boolean requireAudience = false;
    private long allowedClockSkewSeconds = 60;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public boolean isRequireIssuer() {
        return requireIssuer;
    }

    public void setRequireIssuer(boolean requireIssuer) {
        this.requireIssuer = requireIssuer;
    }

    public boolean isRequireAudience() {
        return requireAudience;
    }

    public void setRequireAudience(boolean requireAudience) {
        this.requireAudience = requireAudience;
    }

    public long getAllowedClockSkewSeconds() {
        return allowedClockSkewSeconds;
    }

    public void setAllowedClockSkewSeconds(long allowedClockSkewSeconds) {
        this.allowedClockSkewSeconds = allowedClockSkewSeconds;
    }
}
