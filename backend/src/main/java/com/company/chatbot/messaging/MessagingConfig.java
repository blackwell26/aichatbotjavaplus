package com.company.chatbot.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableKafka
@EnableConfigurationProperties(MessagingProperties.class)
public class MessagingConfig {

    @Bean
    public ObjectMapper messagingObjectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }

    @Bean
    public ProducerFactory<String, Object> producerFactory(MessagingProperties properties) {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, properties.getBootstrapServers());
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, org.springframework.kafka.support.serializer.JsonSerializer.class);
        config.put(org.springframework.kafka.support.serializer.JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate(ProducerFactory<String, Object> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    @Bean
    public ConsumerFactory<String, EventEnvelope> consumerFactory(MessagingProperties properties) {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, properties.getBootstrapServers());
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "aichatbot-consumer");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, org.springframework.kafka.support.serializer.JsonDeserializer.class);
        config.put(org.springframework.kafka.support.serializer.JsonDeserializer.TRUSTED_PACKAGES, "com.company.chatbot.messaging");
        config.put(org.springframework.kafka.support.serializer.JsonDeserializer.VALUE_DEFAULT_TYPE, EventEnvelope.class.getName());
        config.put(org.springframework.kafka.support.serializer.JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config, new StringDeserializer(),
                new org.springframework.kafka.support.serializer.JsonDeserializer<>(EventEnvelope.class, false));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EventEnvelope> kafkaListenerContainerFactory(
            ConsumerFactory<String, EventEnvelope> consumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, EventEnvelope> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(1000L, 2L)));
        return factory;
    }

    @Bean
    public List<NewTopic> chatbotTopics(MessagingProperties properties) {
        return List.of(
                topic(properties, EventTopics.CHAT_MESSAGE_RECEIVED, EventTopics.CHAT_MESSAGE_RECEIVED_DLT),
                topic(properties, EventTopics.RESPONSE_GENERATED, EventTopics.RESPONSE_GENERATED_DLT),
                topic(properties, EventTopics.SESSION_CLOSED, EventTopics.SESSION_CLOSED_DLT),
                topic(properties, EventTopics.ESCALATION_REQUESTED, EventTopics.ESCALATION_REQUESTED_DLT),
                topic(properties, EventTopics.SUPPORT_TICKET_CREATED, EventTopics.SUPPORT_TICKET_CREATED_DLT),
                topic(properties, EventTopics.ORDER_STATUS_UPDATED, EventTopics.ORDER_STATUS_UPDATED_DLT),
                topic(properties, EventTopics.REFUND_REQUEST_CREATED, EventTopics.REFUND_REQUEST_CREATED_DLT),
                topic(properties, EventTopics.REFUND_REQUEST_UPDATED, EventTopics.REFUND_REQUEST_UPDATED_DLT),
                topic(properties, EventTopics.NOTIFICATION_REQUESTED, EventTopics.NOTIFICATION_REQUESTED_DLT),
                topic(properties, EventTopics.KNOWLEDGE_DOCUMENT_INGESTED, EventTopics.KNOWLEDGE_DOCUMENT_INGESTED_DLT),
                topic(properties, EventTopics.ANALYTICS_METRIC_RECORDED, EventTopics.ANALYTICS_METRIC_RECORDED_DLT)
        );
    }

    private static NewTopic topic(MessagingProperties properties, String name, String dltName) {
        String topicName = properties.getTopicPrefix() + name;
        String deadLetterName = properties.getTopicPrefix() + dltName;
        return org.springframework.kafka.config.TopicBuilder.name(topicName)
                .partitions(1)
                .replicas(1)
                .configs(Map.of("dead-letter-topic", deadLetterName))
                .build();
    }
}
