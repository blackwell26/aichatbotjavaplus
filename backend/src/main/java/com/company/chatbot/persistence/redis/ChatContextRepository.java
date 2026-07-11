package com.company.chatbot.persistence.redis;

import com.company.chatbot.config.RedisCacheProperties;
import com.company.chatbot.persistence.redis.model.ChatContextEntry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "persistence.redis.enabled", havingValue = "true", matchIfMissing = true)
public class ChatContextRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Duration ttl;

    public ChatContextRepository(RedisTemplate<String, Object> redisTemplate,
                                 RedisCacheProperties redisCacheProperties) {
        this.redisTemplate = redisTemplate;
        this.ttl = redisCacheProperties.getTtl().getChatContext();
    }

    public void save(ChatContextEntry entry) {
        redisTemplate.opsForValue().set(
                RedisKeyStrategy.chatContext(entry.getSessionId()),
                entry,
                ttl
        );
    }

    public Optional<ChatContextEntry> findBySessionId(String sessionId) {
        Object value = redisTemplate.opsForValue().get(RedisKeyStrategy.chatContext(sessionId));
        if (value instanceof ChatContextEntry entry) {
            return Optional.of(entry);
        }
        return Optional.empty();
    }

    public void deleteBySessionId(String sessionId) {
        redisTemplate.delete(RedisKeyStrategy.chatContext(sessionId));
    }
}
