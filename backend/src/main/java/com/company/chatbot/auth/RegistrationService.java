package com.company.chatbot.auth;

import com.company.chatbot.api.dto.RegisterRequest;
import com.company.chatbot.persistence.postgres.CustomerProfileRepository;
import com.company.chatbot.persistence.postgres.CustomerRepository;
import com.company.chatbot.persistence.postgres.entity.CustomerEntity;
import com.company.chatbot.persistence.postgres.entity.CustomerProfileEntity;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Locale;
import java.util.UUID;

import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class RegistrationService {

    private static final Logger log = LoggerFactory.getLogger(RegistrationService.class);

    private final CustomerRepository customerRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(CustomerRepository customerRepository,
                               CustomerProfileRepository customerProfileRepository,
                               PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(CONFLICT, "An account with this email already exists.");
        }

        CustomerEntity customer = new CustomerEntity();
        customer.setExternalId(UUID.randomUUID());
        customer.setEmail(email);
        customer = customerRepository.save(customer);

        CustomerProfileEntity profile = new CustomerProfileEntity();
        profile.setCustomer(customer);
        profile.setDisplayName(request.getName().trim());
        profile.setPreferences(new HashMap<>());
        customerProfileRepository.save(profile);

        // Passwords are accepted for UI registration flow compatibility.
        // Persisting credentials is intentionally deferred until the auth model
        // is finalized. We still touch the encoder to keep password policy central.
        passwordEncoder.encode(request.getPassword());

        log.info("registered customerId={} email={}", customer.getId(), customer.getEmail());
    }
}
