package com.company.chatbot.api;

import com.company.chatbot.auth.RegistrationService;
import com.company.chatbot.context.CustomerContextResolver;
import com.company.chatbot.security.JwtTokenVerifier;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "security.rate-limit.enabled=false",
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
class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    RegistrationService registrationService;

    @MockBean
    CustomerContextResolver customerContextResolver;

    @MockBean
    JwtTokenVerifier jwtTokenVerifier;

    @Test
    @DisplayName("POST /api/v1/auth/register returns created message")
    void register_returnsCreatedMessage() throws Exception {
        doNothing().when(registrationService).register(any());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Jane Doe",
                                  "email":"jane@example.com",
                                  "password":"Password123!",
                                  "phone":"+1-416-555-0100"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Account created successfully."));
    }
}
