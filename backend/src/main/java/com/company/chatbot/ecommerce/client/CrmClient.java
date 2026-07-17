package com.company.chatbot.ecommerce.client;

import com.company.chatbot.ecommerce.EcommerceIntegrationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@ConditionalOnBean(RestClient.Builder.class)
public class CrmClient extends AbstractEcommerceClient {

    public CrmClient(RestClient.Builder builder, EcommerceIntegrationProperties properties) {
        super(builder, properties.getCrmService());
    }

    CrmClient(RestClient restClient) {
        super(restClient);
    }

    public CustomerProfile getCustomerProfile(String customerId) {
        return get("/api/v1/customers/" + customerId, CustomerProfile.class);
    }

    public CustomerPreferences getCustomerPreferences(String customerId) {
        return get("/api/v1/customers/" + customerId + "/preferences", CustomerPreferences.class);
    }

    public SupportHistory getSupportHistory(String customerId) {
        return get("/api/v1/customers/" + customerId + "/support-history", SupportHistory.class);
    }

    public record CustomerProfile(String customerId, String displayName, String email, String locale) {}
    public record CustomerPreferences(String customerId, Map<String, Object> preferences) {}
    public record SupportHistory(String customerId, List<Map<String, Object>> tickets) {}
}
