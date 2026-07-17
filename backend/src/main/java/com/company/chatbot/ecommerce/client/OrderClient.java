package com.company.chatbot.ecommerce.client;

import com.company.chatbot.ecommerce.EcommerceIntegrationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@ConditionalOnBean(RestClient.Builder.class)
public class OrderClient extends AbstractEcommerceClient {

    public OrderClient(RestClient.Builder builder, EcommerceIntegrationProperties properties) {
        super(builder, properties.getOrderService());
    }

    OrderClient(RestClient restClient) {
        super(restClient);
    }

    public OrderStatus getOrderStatus(String orderNumber) {
        return get("/api/v1/orders/" + orderNumber, OrderStatus.class);
    }

    public List<OrderSummary> getOrderHistory(String customerId) {
        OrderHistoryResponse response = get("/api/v1/orders?customerId=" + customerId, OrderHistoryResponse.class);
        return response == null ? List.of() : response.items();
    }

    public OwnershipCheck validateOwnership(String orderNumber, String customerId) {
        return get("/api/v1/orders/" + orderNumber + "/ownership?customerId=" + customerId, OwnershipCheck.class);
    }

    public record OrderHistoryResponse(List<OrderSummary> items) {}
    public record OrderStatus(String orderNumber, String customerId, String status, String trackingNumber, String currency, Object total) {}
    public record OrderSummary(String orderNumber, String status, Object placedAt, Object total) {}
    public record OwnershipCheck(String orderNumber, String customerId, boolean owned) {}
}
