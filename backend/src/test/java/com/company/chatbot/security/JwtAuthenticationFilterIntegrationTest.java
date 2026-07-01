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

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "security.jwt.secret=test-integration-secret-with-length-0123456789")
public class JwtAuthenticationFilterIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JwtService jwtService;

    @Test
    public void whenValidToken_thenEndpointAccessible() throws Exception {
        // create token using same secret
        String secret = "test-integration-secret-with-length-0123456789";
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .setSubject("bob")
                .claim("roles", List.of("CUSTOMER"))
                .signWith(key)
                .compact();

        mockMvc.perform(get("/test/protected")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    public void whenNoToken_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/test/protected")).andExpect(status().isUnauthorized());
    }

    @Configuration
    static class TestControllerConfig {
        @RestController
        static class TestController {
            @GetMapping("/test/protected")
            public String ok() {
                return "ok";
            }
        }

        @Bean
        public TestController testController() {
            return new TestController();
        }
    }
}
