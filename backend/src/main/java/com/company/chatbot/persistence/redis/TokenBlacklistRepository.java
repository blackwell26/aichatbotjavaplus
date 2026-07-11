package com.company.chatbot.persistence.redis;

import com.company.chatbot.config.RedisCacheProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
@ConditionalOnProperty(name = "persistence.redis.enabled", havingValue = "true", matchIfMissing = true)
public class TokenBlacklistRepository {

    private static final String BLACKLISTED_VALUE = "revoked";

    private final StringRedisTemplate stringRedisTemplate;
    private final Duration defaultTtl;

    public TokenBlacklistRepository(StringRedisTemplate stringRedisTemplate,
                                      RedisCacheProperties redisCacheProperties) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.defaultTtl = redisCacheProperties.getTtl().getTokenBlacklist();
    }

    public void blacklist(String tokenId) {
        blacklist(tokenId, defaultTtl);
    }

    public void blacklist(String tokenId, Duration ttl) {
        stringRedisTemplate.opsForValue().set(
                RedisKeyStrategy.tokenBlacklist(tokenId),
                BLACKLISTED_VALUE,
                ttl
        );
    }

    public boolean isBlacklisted(String tokenId) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(RedisKeyStrategy.tokenBlacklist(tokenId)));
    }

    public void remove(String tokenId) {
        stringRedisTemplate.delete(RedisKeyStrategy.tokenBlacklist(tokenId));
    }
}
