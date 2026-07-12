package com.company.chatbot.persistence.redis;

import com.company.chatbot.config.RedisCacheProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
@ConditionalOnProperty(name = "persistence.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RateLimitRepository {

    private final StringRedisTemplate stringRedisTemplate;
    private final Duration windowTtl;

    public RateLimitRepository(StringRedisTemplate stringRedisTemplate,
                               RedisCacheProperties redisCacheProperties) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.windowTtl = redisCacheProperties.getTtl().getRateLimit();
    }

    public long incrementAndGet(String customerId) {
        return incrementKey(RedisKeyStrategy.rateLimit(customerId));
    }

    public long incrementAndGetForKey(String key) {
        return incrementKey(key);
    }

    private long incrementKey(String key) {
        Long count = stringRedisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            stringRedisTemplate.expire(key, windowTtl);
        }
        return count == null ? 0L : count;
    }

    public long getCount(String customerId) {
        String value = stringRedisTemplate.opsForValue().get(RedisKeyStrategy.rateLimit(customerId));
        if (value == null || value.isBlank()) {
            return 0L;
        }
        return Long.parseLong(value);
    }

    public void reset(String customerId) {
        stringRedisTemplate.delete(RedisKeyStrategy.rateLimit(customerId));
    }

    public Duration getWindowTtl() {
        return windowTtl;
    }
}
