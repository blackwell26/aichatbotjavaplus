package com.company.chatbot.api;

import com.company.chatbot.ai.OllamaChatGateway;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {
        com.company.chatbot.ChatbotApplication.class,
        AdminManagerApiSecurityIntegrationTest.TestControllerConfig.class
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "security.jwt.secret=test-integration-secret-with-length-0123456789",
        "persistence.postgres.enabled=false",
        "persistence.mongo.enabled=false",
        "persistence.redis.enabled=false",
        "security.rate-limit.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration"
})
class AdminManagerApiSecurityIntegrationTest {

    private static final String SECRET = "test-integration-secret-with-length-0123456789";

    @Autowired
    MockMvc mockMvc;

    @MockBean
    OllamaChatGateway ollamaChatGateway;

    @Test
    void customerCannotAccessAdminKnowledge() throws Exception {
        mockMvc.perform(get("/api/v1/admin/knowledge/documents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("customer-1", List.of("CUSTOMER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCannotAccessAdminKnowledge() throws Exception {
        mockMvc.perform(get("/api/v1/admin/knowledge/documents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("manager-1", List.of("MANAGER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanAccessManagerAnalytics() throws Exception {
        mockMvc.perform(get("/api/v1/manager/analytics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("manager-1", List.of("MANAGER")))
                        .param("periodStart", "2026-07-01T00:00:00Z")
                        .param("periodEnd", "2026-07-02T00:00:00Z")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chatVolume").value(7));
    }

    @Test
    void adminCanAccessManagerAnalytics() throws Exception {
        mockMvc.perform(get("/api/v1/manager/analytics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("admin-1", List.of("ADMIN")))
                        .param("periodStart", "2026-07-01T00:00:00Z")
                        .param("periodEnd", "2026-07-02T00:00:00Z")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void authenticatedUserCanReadOwnAccountContext() throws Exception {
        mockMvc.perform(get("/api/v1/account/context")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("customer-1", List.of("CUSTOMER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value("customer-1"));
    }

    private String tokenFor(String subject, List<String> roles) {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setSubject(subject)
                .claim("customerId", subject)
                .claim("roles", roles)
                .signWith(key)
                .compact();
    }

    @Configuration
    static class TestControllerConfig {
        @RestController
        static class AdminController {
            @GetMapping("/api/v1/admin/knowledge/documents")
            public String adminKnowledge() {
                return "ok";
            }
        }

        @RestController
        static class ManagerController {
            @GetMapping("/api/v1/manager/analytics")
            public com.company.chatbot.analytics.AnalyticsSnapshot analytics() {
                return new com.company.chatbot.analytics.AnalyticsSnapshot(
                        1L,
                        java.time.Instant.parse("2026-07-01T00:00:00Z"),
                        java.time.Instant.parse("2026-07-02T00:00:00Z"),
                        7L,
                        123.0,
                        0.25,
                        4.2,
                        98.0,
                        0.1,
                        java.time.Instant.parse("2026-07-02T01:00:00Z")
                );
            }
        }
    }
}
