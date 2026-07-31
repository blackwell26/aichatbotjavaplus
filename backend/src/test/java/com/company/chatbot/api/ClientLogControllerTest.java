package com.company.chatbot.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = com.company.chatbot.ChatbotApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "security.rate-limit.enabled=false",
        "persistence.redis.enabled=false",
        "persistence.mongo.enabled=false",
        "persistence.postgres.enabled=false",
        "spring.autoconfigure.exclude=" +
                "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration," +
                "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration," +
                "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
                "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
class ClientLogControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/v1/client-logs accepts payload")
    void ingest_acceptsPayload() throws Exception {
        mockMvc.perform(post("/api/v1/client-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "level":"ERROR",
                                  "message":"Frontend bootstrap failed",
                                  "source":"frontend",
                                  "url":"http://localhost:4200/"
                                }
                                """))
                .andExpect(status().isAccepted());
    }
}
