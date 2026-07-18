package com.company.chatbot.api;

import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
@PreAuthorize("isAuthenticated()")
public class AccountController {

    @GetMapping("/context")
    public ResponseEntity<CustomerContext> getContext(@CurrentCustomer CustomerContext customer) {
        return ResponseEntity.ok(customer);
    }
}
