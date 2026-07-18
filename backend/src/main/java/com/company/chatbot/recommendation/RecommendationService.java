package com.company.chatbot.recommendation;

import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.client.OrderClient;
import com.company.chatbot.ecommerce.client.ProductClient;
import com.company.chatbot.ecommerce.client.ProductClient.InventoryInfo;
import com.company.chatbot.ecommerce.client.ProductClient.ProductDetails;
import com.company.chatbot.ecommerce.client.ProductClient.ProductSearchResult;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@ConditionalOnBean({OrderClient.class, ProductClient.class})
public class RecommendationService {

    private static final int MAX_RECOMMENDATIONS = 3;
    private static final Set<String> RESTRICTED_FLAGS = Set.of("restricted", "ageRestricted", "discontinued", "blocked");

    private final OrderClient orderClient;
    private final ProductClient productClient;

    public RecommendationService(OrderClient orderClient, ProductClient productClient) {
        this.orderClient = orderClient;
        this.productClient = productClient;
    }

    public List<Recommendation> recommend(CustomerContext customer, String query) {
        if (customer == null || customer.getCustomerId() == null || customer.getCustomerId().isBlank()) {
            return List.of();
        }
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isBlank()) {
            return List.of();
        }

        List<OrderClient.OrderSummary> purchaseHistory = orderClient.getOrderHistory(customer.getCustomerId());
        List<ProductSearchResult> candidates = productClient.search(normalizedQuery);
        if (candidates.isEmpty()) {
            return List.of();
        }

        List<Recommendation> recommendations = new ArrayList<>();
        for (ProductSearchResult candidate : candidates) {
            if (candidate == null || candidate.productId() == null || candidate.productId().isBlank()) {
                continue;
            }

            ProductDetails details = safeProductDetails(candidate.productId());
            if (details == null) {
                continue;
            }

            InventoryInfo inventory = safeInventory(candidate.productId());
            if (!isAvailable(details, inventory)) {
                continue;
            }
            if (isRestricted(details)) {
                continue;
            }

            double score = score(candidate, purchaseHistory, details, inventory, normalizedQuery);
            String reason = buildReason(purchaseHistory, details, inventory, normalizedQuery);
            recommendations.add(new Recommendation(candidate.productId(), score, reason, "catalog+history"));

            if (recommendations.size() >= MAX_RECOMMENDATIONS) {
                break;
            }
        }

        return recommendations;
    }

    public Map<String, Object> toMetadata(List<Recommendation> recommendations) {
        if (recommendations == null || recommendations.isEmpty()) {
            return Map.of();
        }
        List<Map<String, Object>> payload = recommendations.stream()
                .map(rec -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("productId", rec.getProductId());
                    item.put("score", rec.getScore());
                    item.put("reason", rec.getReason());
                    item.put("source", rec.getSource());
                    return item;
                })
                .toList();
        return Map.of("recommendations", payload);
    }

    private ProductDetails safeProductDetails(String productId) {
        try {
            return productClient.getProduct(productId);
        } catch (Exception ex) {
            return null;
        }
    }

    private InventoryInfo safeInventory(String productId) {
        try {
            return productClient.checkInventory(productId);
        } catch (Exception ex) {
            return null;
        }
    }

    private boolean isAvailable(ProductDetails details, InventoryInfo inventory) {
        if (inventory == null) {
            return false;
        }
        Integer available = inventory.availableQuantity();
        return inventory.inStock() && available != null && available > 0 && details.availableQuantity() != null
                && details.availableQuantity() > 0;
    }

    private boolean isRestricted(ProductDetails details) {
        if (details.attributes() == null || details.attributes().isEmpty()) {
            return false;
        }
        for (String key : RESTRICTED_FLAGS) {
            Object value = details.attributes().get(key);
            if (value instanceof Boolean bool && bool) {
                return true;
            }
            if (value instanceof String str && Boolean.parseBoolean(str)) {
                return true;
            }
        }
        return false;
    }

    private double score(ProductSearchResult candidate, List<OrderClient.OrderSummary> purchaseHistory,
                         ProductDetails details, InventoryInfo inventory, String query) {
        double score = 0.5;
        score += Math.min(0.2, purchaseHistory.size() * 0.03);
        score += candidate.availableQuantity() == null ? 0.0 : Math.min(0.1, candidate.availableQuantity() / 100.0);
        score += details.price() == null ? 0.0 : 0.05;
        score += inventory.availableQuantity() == null ? 0.0 : Math.min(0.1, inventory.availableQuantity() / 100.0);
        if (details.name() != null && query != null) {
            String name = details.name().toLowerCase(Locale.ROOT);
            for (String token : query.toLowerCase(Locale.ROOT).split("\\s+")) {
                if (token.length() >= 3 && name.contains(token)) {
                    score += 0.1;
                    break;
                }
            }
        }
        return Math.min(1.0, score);
    }

    private String buildReason(List<OrderClient.OrderSummary> purchaseHistory, ProductDetails details,
                               InventoryInfo inventory, String query) {
        List<String> parts = new ArrayList<>();
        if (!purchaseHistory.isEmpty()) {
            parts.add("matches your recent order history");
        }
        if (details.price() != null) {
            parts.add("priced at " + details.price());
        }
        if (inventory != null && inventory.availableQuantity() != null) {
            parts.add(inventory.availableQuantity() + " in stock");
        }
        if (query != null && !query.isBlank()) {
            parts.add("related to \"" + query + "\"");
        }
        if (parts.isEmpty()) {
            parts.add("curated from the current product catalog");
        }
        return parts.stream().filter(Objects::nonNull).collect(Collectors.joining("; "));
    }
}
