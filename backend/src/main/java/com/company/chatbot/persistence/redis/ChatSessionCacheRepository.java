package com.company.chatbot.persistence.redis;

import com.company.chatbot.config.RedisCacheProperties;
import com.company.chatbot.persistence.redis.model.ChatSessionCacheEntry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "persistence.redis.enabled", havingValue = "true", matchIfMissing = true)
public class ChatSessionCacheRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Duration ttl;

    public ChatSessionCacheRepository(RedisTemplate<String, Object> redisTemplate,
                                      RedisCacheProperties redisCacheProperties) {
        this.redisTemplate = redisTemplate;
        this.ttl = redisCacheProperties.getTtl().getChatSession();
    }

    public void save(ChatSessionCacheEntry entry) {
        redisTemplate.opsForValue().set(
                RedisKeyStrategy.chatSession(entry.getSessionId()),
                entry,
                ttl
        );
    }

    public Optional<ChatSessionCacheEntry> findBySessionId(String sessionId) {
        Object value = redisTemplate.opsForValue().get(RedisKeyStrategy.chatSession(sessionId));
        if (value instanceof ChatSessionCacheEntry entry) {
            return Optional.of(entry);
        }
        return Optional.empty();
    }

    public void deleteBySessionId(String sessionId) {
        redisTemplate.delete(RedisKeyStrategy.chatSession(sessionId));
    }

    public boolean refreshTtl(String sessionId) {
        return Boolean.TRUE.equals(redisTemplate.expire(RedisKeyStrategy.chatSession(sessionId), ttl));
    }
}
