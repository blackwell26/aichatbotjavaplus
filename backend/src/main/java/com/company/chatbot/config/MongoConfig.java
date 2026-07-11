package com.company.chatbot.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@ConditionalOnProperty(name = "persistence.mongo.enabled", havingValue = "true", matchIfMissing = true)
@EnableMongoRepositories(basePackages = "com.company.chatbot.persistence.mongo")
public class MongoConfig {
}
