package com.company.chatbot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConfigurationProperties(prefix = "persistence.redis")
public class RedisCacheProperties {

    private boolean enabled = true;
    private Ttl ttl = new Ttl();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Ttl getTtl() {
        return ttl;
    }

    public void setTtl(Ttl ttl) {
        this.ttl = ttl;
    }

    public static class Ttl {

        private Duration chatSession = Duration.ofHours(24);
        private Duration chatContext = Duration.ofMinutes(30);
        private Duration ragQueryCache = Duration.ofMinutes(15);
        private Duration tokenBlacklist = Duration.ofHours(1);
        private Duration rateLimit = Duration.ofMinutes(1);

        public Duration getChatSession() {
            return chatSession;
        }

        public void setChatSession(Duration chatSession) {
            this.chatSession = chatSession;
        }

        public Duration getChatContext() {
            return chatContext;
        }

        public void setChatContext(Duration chatContext) {
            this.chatContext = chatContext;
        }

        public Duration getRagQueryCache() {
            return ragQueryCache;
        }

        public void setRagQueryCache(Duration ragQueryCache) {
            this.ragQueryCache = ragQueryCache;
        }

        public Duration getTokenBlacklist() {
            return tokenBlacklist;
        }

        public void setTokenBlacklist(Duration tokenBlacklist) {
            this.tokenBlacklist = tokenBlacklist;
        }

        public Duration getRateLimit() {
            return rateLimit;
        }

        public void setRateLimit(Duration rateLimit) {
            this.rateLimit = rateLimit;
        }
    }
}
