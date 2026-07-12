package com.company.chatbot.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {
        com.company.chatbot.ChatbotApplication.class,
        SecurityAuthorizationIntegrationTest.TestControllerConfig.class
})
@AutoConfigureMockMvc
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
class SecurityAuthorizationIntegrationTest {

    private static final String SECRET = "test-integration-secret-with-length-0123456789";

    @Autowired
    MockMvc mockMvc;

    @Test
    void customerCanAccessChatEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/chat/sessions/test-access")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("customer-1", List.of("CUSTOMER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void customerCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/knowledge/documents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("customer-1", List.of("CUSTOMER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/knowledge/documents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenFor("admin-1", List.of("ADMIN")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticatedRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/v1/chat/sessions/test-access"))
                .andExpect(status().isUnauthorized());
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
        static class TestController {
            @GetMapping("/api/v1/chat/sessions/test-access")
            public String chatAccess() {
                return "ok";
            }

            @GetMapping("/api/v1/admin/knowledge/documents")
            public String adminAccess() {
                return "ok";
            }
        }
    }
}
