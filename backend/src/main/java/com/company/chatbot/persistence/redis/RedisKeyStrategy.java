package com.company.chatbot.persistence.redis;

import java.util.Objects;

/**
 * Canonical Redis key patterns for chat sessions, RAG context, query cache, token blacklist, and rate limits.
 */
public final class RedisKeyStrategy {

    public static final String CHAT_SESSION_PREFIX = "chat:session:";
    public static final String CHAT_CONTEXT_PREFIX = "chat:context:";
    public static final String RAG_QUERY_CACHE_PREFIX = "rag:query-cache:";
    public static final String TOKEN_BLACKLIST_PREFIX = "auth:token-blacklist:";
    public static final String RATE_LIMIT_PREFIX = "rate-limit:";

    private RedisKeyStrategy() {}

    public static String chatSession(String sessionId) {
        return CHAT_SESSION_PREFIX + requireNonBlank(sessionId, "sessionId");
    }

    public static String chatContext(String sessionId) {
        return CHAT_CONTEXT_PREFIX + requireNonBlank(sessionId, "sessionId");
    }

    public static String ragQueryCache(String queryHash) {
        return RAG_QUERY_CACHE_PREFIX + requireNonBlank(queryHash, "queryHash");
    }

    public static String tokenBlacklist(String tokenId) {
        return TOKEN_BLACKLIST_PREFIX + requireNonBlank(tokenId, "tokenId");
    }

    public static String rateLimit(String customerId) {
        return RATE_LIMIT_PREFIX + requireNonBlank(customerId, "customerId");
    }

    public static String rateLimitScope(String scope, String customerId) {
        return RATE_LIMIT_PREFIX + requireNonBlank(scope, "scope") + ":"
                + requireNonBlank(customerId, "customerId");
    }

    private static String requireNonBlank(String value, String fieldName) {
        Objects.requireNonNull(value, fieldName + " must not be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return value;
    }
}
