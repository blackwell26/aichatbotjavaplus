package com.company.chatbot.api;

import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.client.OrderClient;
import com.company.chatbot.ecommerce.client.OrderClient.OrderStatus;
import com.company.chatbot.ecommerce.client.OrderClient.OrderSummary;
import com.company.chatbot.ecommerce.client.ShippingClient;
import com.company.chatbot.ecommerce.client.ShippingClient.TrackingInfo;
import com.company.chatbot.security.ResourceOwnershipValidator;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrderControllerTest {

    @Test
    void listOrders_returnsOrders() {
        OrderClient orderClient = mock(OrderClient.class);
        when(orderClient.getOrderHistory("cust-001")).thenReturn(List.of(
                new OrderSummary("ORD-1", "SHIPPED", Instant.parse("2026-07-16T10:00:00Z"), 19.99)));

        OrderController controller = new OrderController(orderClient, mock(ShippingClient.class), mock(ResourceOwnershipValidator.class));

        assertThat(controller.listOrders(new CustomerContext("cust-001", "Jane", List.of("CUSTOMER"))))
                .hasSize(1);
    }

    @Test
    void getOrder_returnsOrder() {
        OrderClient orderClient = mock(OrderClient.class);
        when(orderClient.getOrderStatus("ORD-1")).thenReturn(
                new OrderStatus("ORD-1", "cust-001", "SHIPPED", "TRK-1", "USD", 19.99));
        ResourceOwnershipValidator ownershipValidator = mock(ResourceOwnershipValidator.class);

        OrderController controller = new OrderController(orderClient, mock(ShippingClient.class), ownershipValidator);
        OrderStatus status = controller.getOrder("ORD-1", new CustomerContext("cust-001", "Jane", List.of("CUSTOMER")));

        assertThat(status.orderNumber()).isEqualTo("ORD-1");
    }

    @Test
    void getOrder_forbidden_throwsAccessDenied() {
        OrderClient orderClient = mock(OrderClient.class);
        when(orderClient.getOrderStatus("ORD-2")).thenReturn(
                new OrderStatus("ORD-2", "cust-other", "SHIPPED", "TRK-1", "USD", 19.99));
        ResourceOwnershipValidator ownershipValidator = mock(ResourceOwnershipValidator.class);
        doThrow(new AccessDeniedException("Access denied to order data"))
                .when(ownershipValidator).verifyOrderAccess(any(CustomerContext.class), eq("cust-other"));

        OrderController controller = new OrderController(orderClient, mock(ShippingClient.class), ownershipValidator);

        assertThatThrownBy(() -> controller.getOrder("ORD-2", new CustomerContext("cust-001", "Jane", List.of("CUSTOMER"))))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getOrder_notFound_throws404() {
        OrderClient orderClient = mock(OrderClient.class);
        when(orderClient.getOrderStatus("ORD-404")).thenThrow(
                new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Order not found"));

        OrderController controller = new OrderController(orderClient, mock(ShippingClient.class), mock(ResourceOwnershipValidator.class));

        assertThatThrownBy(() -> controller.getOrder("ORD-404", new CustomerContext("cust-001", "Jane", List.of("CUSTOMER"))))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getTracking_returnsTracking() {
        OrderClient orderClient = mock(OrderClient.class);
        when(orderClient.getOrderStatus("ORD-1")).thenReturn(
                new OrderStatus("ORD-1", "cust-001", "SHIPPED", "TRK-1", "USD", 19.99));
        ShippingClient shippingClient = mock(ShippingClient.class);
        when(shippingClient.getTracking("TRK-1"))
                .thenReturn(new TrackingInfo("TRK-1", "UPS", "IN_TRANSIT", Instant.parse("2026-07-16T10:00:00Z")));

        OrderController controller = new OrderController(orderClient, shippingClient, mock(ResourceOwnershipValidator.class));
        TrackingInfo tracking = controller.getTracking("ORD-1", new CustomerContext("cust-001", "Jane", List.of("CUSTOMER")));

        assertThat(tracking.carrier()).isEqualTo("UPS");
    }
}
