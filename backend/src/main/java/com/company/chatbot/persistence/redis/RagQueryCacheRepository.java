package com.company.chatbot.persistence.redis;

import com.company.chatbot.config.RedisCacheProperties;
import com.company.chatbot.persistence.redis.model.RagQueryCacheEntry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "persistence.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RagQueryCacheRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Duration ttl;

    public RagQueryCacheRepository(RedisTemplate<String, Object> redisTemplate,
                                   RedisCacheProperties redisCacheProperties) {
        this.redisTemplate = redisTemplate;
        this.ttl = redisCacheProperties.getTtl().getRagQueryCache();
    }

    public void save(RagQueryCacheEntry entry) {
        redisTemplate.opsForValue().set(
                RedisKeyStrategy.ragQueryCache(entry.getQueryHash()),
                entry,
                ttl
        );
    }

    public Optional<RagQueryCacheEntry> findByQueryHash(String queryHash) {
        Object value = redisTemplate.opsForValue().get(RedisKeyStrategy.ragQueryCache(queryHash));
        if (value instanceof RagQueryCacheEntry entry) {
            return Optional.of(entry);
        }
        return Optional.empty();
    }

    public void deleteByQueryHash(String queryHash) {
        redisTemplate.delete(RedisKeyStrategy.ragQueryCache(queryHash));
    }
}
