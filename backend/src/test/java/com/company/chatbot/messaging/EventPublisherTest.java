package com.company.chatbot.messaging;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

class EventPublisherTest {

    @Test
    void prefixesTopicAndPublishesEnvelope() {
        KafkaTemplate<String, Object> kafkaTemplate = Mockito.mock(KafkaTemplate.class);
        MessagingProperties properties = new MessagingProperties();
        properties.setTopicPrefix("test.");
        EventPublisher publisher = new EventPublisher(kafkaTemplate, properties);

        EventEnvelope envelope = publisher.publish(
                EventTopics.ORDER_STATUS_UPDATED,
                "order.status.updated",
                Map.of("orderNumber", "ORD-2"),
                "corr-2",
                "cause-2",
                "tenant-2",
                "1"
        );

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object> valueCaptor = ArgumentCaptor.forClass(Object.class);
        verify(kafkaTemplate).send(topicCaptor.capture(), Mockito.anyString(), valueCaptor.capture());

        assertThat(topicCaptor.getValue()).isEqualTo("test." + EventTopics.ORDER_STATUS_UPDATED);
        assertThat(valueCaptor.getValue()).isInstanceOf(EventEnvelope.class);
        assertThat(envelope.payload()).containsEntry("orderNumber", "ORD-2");
    }
}
