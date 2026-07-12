package com.company.chatbot.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "security.rate-limit")
public class SecurityRateLimitProperties {

    private boolean enabled = true;
    private int chatMaxRequests = 60;
    private int adminUploadMaxRequests = 10;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getChatMaxRequests() {
        return chatMaxRequests;
    }

    public void setChatMaxRequests(int chatMaxRequests) {
        this.chatMaxRequests = chatMaxRequests;
    }

    public int getAdminUploadMaxRequests() {
        return adminUploadMaxRequests;
    }

    public void setAdminUploadMaxRequests(int adminUploadMaxRequests) {
        this.adminUploadMaxRequests = adminUploadMaxRequests;
    }
}
