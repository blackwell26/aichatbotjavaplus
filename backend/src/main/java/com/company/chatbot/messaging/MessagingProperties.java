package com.company.chatbot.messaging;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.LinkedHashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "messaging.kafka")
public class MessagingProperties {

    private String bootstrapServers = "localhost:9092";
    private String topicPrefix = "";
    private Map<String, String> topics = new LinkedHashMap<>();
    private Map<String, String> deadLetterTopics = new LinkedHashMap<>();

    public String getBootstrapServers() {
        return bootstrapServers;
    }

    public void setBootstrapServers(String bootstrapServers) {
        this.bootstrapServers = bootstrapServers;
    }

    public String getTopicPrefix() {
        return topicPrefix;
    }

    public void setTopicPrefix(String topicPrefix) {
        this.topicPrefix = topicPrefix;
    }

    public Map<String, String> getTopics() {
        return topics;
    }

    public void setTopics(Map<String, String> topics) {
        this.topics = topics;
    }

    public Map<String, String> getDeadLetterTopics() {
        return deadLetterTopics;
    }

    public void setDeadLetterTopics(Map<String, String> deadLetterTopics) {
        this.deadLetterTopics = deadLetterTopics;
    }
}
