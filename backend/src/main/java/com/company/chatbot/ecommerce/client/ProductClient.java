package com.company.chatbot.ecommerce.client;

import com.company.chatbot.ecommerce.EcommerceIntegrationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnBean(RestClient.Builder.class)
public class ProductClient extends AbstractEcommerceClient {

    public ProductClient(RestClient.Builder builder, EcommerceIntegrationProperties properties) {
        super(builder, properties.getProductService());
    }

    ProductClient(RestClient restClient) {
        super(restClient);
    }

    public ProductDetails getProduct(String productId) {
        return get("/api/v1/products/" + productId, ProductDetails.class);
    }

    public List<ProductSearchResult> search(String query) {
        ProductSearchResponse response = get("/api/v1/products/search?q=" + query, ProductSearchResponse.class);
        return response == null ? List.of() : response.items();
    }

    public PricingInfo getPricing(String productId) {
        return get("/api/v1/products/" + productId + "/pricing", PricingInfo.class);
    }

    public ProductSpecifications getSpecifications(String productId) {
        return get("/api/v1/products/" + productId + "/specifications", ProductSpecifications.class);
    }

    public InventoryInfo checkInventory(String productId) {
        return get("/api/v1/products/" + productId + "/inventory", InventoryInfo.class);
    }

    public record ProductSearchResponse(List<ProductSearchResult> items) {}
    public record ProductSearchResult(String productId, String name, BigDecimal price, Integer availableQuantity) {}
    public record ProductDetails(String productId, String name, String description, BigDecimal price,
                                 String currency, Integer availableQuantity, Map<String, Object> attributes) {}
    public record PricingInfo(String productId, BigDecimal price, String currency, BigDecimal discountPrice) {}
    public record ProductSpecifications(String productId, Map<String, Object> specifications) {}
    public record InventoryInfo(String productId, Integer availableQuantity, boolean inStock) {}
}
