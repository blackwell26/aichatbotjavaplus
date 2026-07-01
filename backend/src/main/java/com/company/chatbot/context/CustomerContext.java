package com.company.chatbot.context;

import java.util.List;

public class CustomerContext {
    private final String customerId;
    private final String username;
    private final List<String> roles;

    public CustomerContext(String customerId, String username, List<String> roles) {
        this.customerId = customerId;
        this.username = username;
        this.roles = roles;
    }

    public String getCustomerId() {
        return customerId;
    }

    public String getUsername() {
        return username;
    }

    public List<String> getRoles() {
        return roles;
    }
}
