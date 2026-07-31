package com.company.chatbot.api;

import com.company.chatbot.api.dto.RegisterRequest;
import com.company.chatbot.api.dto.RegisterResponse;
import com.company.chatbot.auth.RegistrationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final RegistrationService registrationService;

    public AuthController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("register requested email={}", request.getEmail());
        registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("Account created successfully."));
    }
}
