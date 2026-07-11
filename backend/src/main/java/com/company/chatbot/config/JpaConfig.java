package com.company.chatbot.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@ConditionalOnProperty(name = "persistence.postgres.enabled", havingValue = "true", matchIfMissing = true)
@EnableJpaRepositories(basePackages = "com.company.chatbot.persistence.postgres")
@EntityScan(basePackages = "com.company.chatbot.persistence.postgres.entity")
public class JpaConfig {
}
