package com.company.chatbot.persistence.redis.model;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Cached RAG retrieval result keyed by a normalized query hash.
 */
public class RagQueryCacheEntry {

    private String queryHash;
    private String queryText;
    private List<Map<String, Object>> citations;
    private Instant cachedAt;

    public RagQueryCacheEntry() {}

    public String getQueryHash() {
        return queryHash;
    }

    public void setQueryHash(String queryHash) {
        this.queryHash = queryHash;
    }

    public String getQueryText() {
        return queryText;
    }

    public void setQueryText(String queryText) {
        this.queryText = queryText;
    }

    public List<Map<String, Object>> getCitations() {
        return citations == null ? Collections.emptyList() : citations;
    }

    public void setCitations(List<Map<String, Object>> citations) {
        this.citations = citations;
    }

    public Instant getCachedAt() {
        return cachedAt;
    }

    public void setCachedAt(Instant cachedAt) {
        this.cachedAt = cachedAt;
    }
}
