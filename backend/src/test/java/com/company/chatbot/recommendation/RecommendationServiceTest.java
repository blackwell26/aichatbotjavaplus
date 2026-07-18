package com.company.chatbot.recommendation;

import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.client.OrderClient;
import com.company.chatbot.ecommerce.client.ProductClient;
import com.company.chatbot.ecommerce.client.ProductClient.InventoryInfo;
import com.company.chatbot.ecommerce.client.ProductClient.ProductDetails;
import com.company.chatbot.ecommerce.client.ProductClient.ProductSearchResult;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecommendationServiceTest {

    @Test
    void filtersUnavailableAndRestrictedProductsAndExplainsWhy() {
        OrderClient orderClient = mock(OrderClient.class);
        ProductClient productClient = mock(ProductClient.class);
        RecommendationService service = new RecommendationService(orderClient, productClient);
        CustomerContext customer = new CustomerContext("cust-1", "Jane", List.of("ROLE_CUSTOMER"));

        when(orderClient.getOrderHistory("cust-1"))
                .thenReturn(List.of(new OrderClient.OrderSummary("ORD-1", "DELIVERED", null, null)));

        when(productClient.search("wireless headphones"))
                .thenReturn(List.of(
                        new ProductSearchResult("p-1", "Wireless Headphones", new BigDecimal("79.99"), 8),
                        new ProductSearchResult("p-2", "Premium Gift Card", new BigDecimal("25.00"), 100),
                        new ProductSearchResult("p-3", "Out of Stock Speaker", new BigDecimal("129.99"), 0)
                ));

        when(productClient.getProduct("p-1"))
                .thenReturn(new ProductDetails("p-1", "Wireless Headphones", "Noise canceling", new BigDecimal("79.99"), "USD", 8, Map.of("color", "black")));
        when(productClient.checkInventory("p-1"))
                .thenReturn(new InventoryInfo("p-1", 8, true));

        when(productClient.getProduct("p-2"))
                .thenReturn(new ProductDetails("p-2", "Premium Gift Card", "Restricted item", new BigDecimal("25.00"), "USD", 100, Map.of("restricted", true)));
        when(productClient.checkInventory("p-2"))
                .thenReturn(new InventoryInfo("p-2", 100, true));

        when(productClient.getProduct("p-3"))
                .thenReturn(new ProductDetails("p-3", "Out of Stock Speaker", "Speaker", new BigDecimal("129.99"), "USD", 0, Map.of()));
        when(productClient.checkInventory("p-3"))
                .thenReturn(new InventoryInfo("p-3", 0, false));

        List<Recommendation> recommendations = service.recommend(customer, "wireless headphones");

        assertThat(recommendations).hasSize(1);
        Recommendation recommendation = recommendations.getFirst();
        assertThat(recommendation.getProductId()).isEqualTo("p-1");
        assertThat(recommendation.getReason()).contains("recent order history");
        assertThat(recommendation.getReason()).contains("in stock");
        assertThat(recommendation.getReason()).contains("wireless headphones");
        assertThat(recommendation.getScore()).isBetween(0.5, 1.0);
    }

    @Test
    void returnsEmptyMetadataWhenNoRecommendationsExist() {
        OrderClient orderClient = mock(OrderClient.class);
        ProductClient productClient = mock(ProductClient.class);
        RecommendationService service = new RecommendationService(orderClient, productClient);

        when(orderClient.getOrderHistory("cust-1")).thenReturn(List.of());
        when(productClient.search("unknown query")).thenReturn(List.of());

        assertThat(service.recommend(new CustomerContext("cust-1", "Jane", List.of("ROLE_CUSTOMER")), "unknown query"))
                .isEmpty();
        assertThat(service.toMetadata(List.of())).isEmpty();
    }
}
