package com.company.chatbot.ecommerce.client;

import com.company.chatbot.ecommerce.EcommerceIntegrationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;

@Service
@ConditionalOnBean(RestClient.Builder.class)
public class ShippingClient extends AbstractEcommerceClient {

    public ShippingClient(RestClient.Builder builder, EcommerceIntegrationProperties properties) {
        super(builder, properties.getShippingService());
    }

    ShippingClient(RestClient restClient) {
        super(restClient);
    }

    public TrackingInfo getTracking(String trackingNumber) {
        return get("/api/v1/shipments/" + trackingNumber, TrackingInfo.class);
    }

    public CarrierStatus getCarrierStatus(String carrierCode) {
        return get("/api/v1/carriers/" + carrierCode + "/status", CarrierStatus.class);
    }

    public EstimatedDelivery getEstimatedDelivery(String orderNumber) {
        return get("/api/v1/orders/" + orderNumber + "/delivery-estimate", EstimatedDelivery.class);
    }

    public record TrackingInfo(String trackingNumber, String carrier, String status, Instant lastUpdated) {}
    public record CarrierStatus(String carrierCode, String status, String region) {}
    public record EstimatedDelivery(String orderNumber, Instant estimatedDeliveryDate, String status) {}
}
