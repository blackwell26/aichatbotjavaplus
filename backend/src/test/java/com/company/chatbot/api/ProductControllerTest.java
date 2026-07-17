package com.company.chatbot.api;

import com.company.chatbot.ecommerce.client.ProductClient;
import com.company.chatbot.ecommerce.client.ProductClient.ProductDetails;
import com.company.chatbot.ecommerce.client.ProductClient.ProductSearchResult;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductControllerTest {

    @Test
    void search_returnsProducts() {
        ProductClient productClient = mock(ProductClient.class);
        when(productClient.search("widget")).thenReturn(List.of(
                new ProductSearchResult("SKU-1", "Widget", BigDecimal.TEN, 5)));

        ProductController controller = new ProductController(productClient);

        assertThat(controller.search("widget")).hasSize(1);
        assertThat(controller.search("widget").get(0).productId()).isEqualTo("SKU-1");
    }

    @Test
    void getProduct_returnsProduct() {
        ProductClient productClient = mock(ProductClient.class);
        when(productClient.getProduct("SKU-1")).thenReturn(
                new ProductDetails("SKU-1", "Widget", "Desc", BigDecimal.TEN, "USD", 5, Map.of()));

        ProductController controller = new ProductController(productClient);

        assertThat(controller.getProduct("SKU-1", null).productId()).isEqualTo("SKU-1");
    }

    @Test
    void getProduct_notFound_returns404() {
        ProductClient productClient = mock(ProductClient.class);
        when(productClient.getProduct("SKU-404")).thenThrow(
                new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Product not found"));

        ProductController controller = new ProductController(productClient);

        assertThatThrownBy(() -> controller.getProduct("SKU-404", null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Product not found");
    }
}
