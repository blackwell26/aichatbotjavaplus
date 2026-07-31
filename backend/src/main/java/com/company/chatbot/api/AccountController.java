package com.company.chatbot.api;

import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/v1/account")
@PreAuthorize("isAuthenticated()")
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);

    @GetMapping("/context")
    public ResponseEntity<CustomerContext> getContext(@CurrentCustomer CustomerContext customer) {
        log.info("account context requested customerId={}", customer != null ? customer.getCustomerId() : "anonymous");
        return ResponseEntity.ok(customer);
    }
}
