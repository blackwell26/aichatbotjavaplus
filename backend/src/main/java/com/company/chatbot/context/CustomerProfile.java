package com.company.chatbot.context;

import java.util.Collections;
import java.util.Map;

/**
 * Customer profile and preference data used to personalize chat experiences.
 */
public class CustomerProfile {

    private Long customerId;
    private String displayName;
    private String locale;
    private String timezone;
    private Map<String, Object> preferences;

    public CustomerProfile() {}

    public CustomerProfile(Long customerId, String displayName, String locale, String timezone,
                           Map<String, Object> preferences) {
        this.customerId = customerId;
        this.displayName = displayName;
        this.locale = locale;
        this.timezone = timezone;
        this.preferences = preferences;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Map<String, Object> getPreferences() {
        return preferences == null ? Collections.emptyMap() : preferences;
    }

    public void setPreferences(Map<String, Object> preferences) {
        this.preferences = preferences;
    }
}
