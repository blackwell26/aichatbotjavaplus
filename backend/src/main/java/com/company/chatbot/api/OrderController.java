package com.company.chatbot.api;

import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.client.OrderClient;
import com.company.chatbot.ecommerce.client.OrderClient.OrderStatus;
import com.company.chatbot.ecommerce.client.OrderClient.OrderSummary;
import com.company.chatbot.ecommerce.client.ShippingClient;
import com.company.chatbot.ecommerce.client.ShippingClient.TrackingInfo;
import com.company.chatbot.security.ResourceOwnershipValidator;
import com.company.chatbot.security.validation.IdValidator;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@Validated
@PreAuthorize("hasAnyRole('CUSTOMER','AGENT','MANAGER','ADMIN','SYSTEM')")
public class OrderController {

    private final OrderClient orderClient;
    private final ShippingClient shippingClient;
    private final ResourceOwnershipValidator ownershipValidator;

    public OrderController(OrderClient orderClient,
                           ShippingClient shippingClient,
                           ResourceOwnershipValidator ownershipValidator) {
        this.orderClient = orderClient;
        this.shippingClient = shippingClient;
        this.ownershipValidator = ownershipValidator;
    }

    @GetMapping
    public List<OrderSummary> listOrders(@CurrentCustomer CustomerContext customer) {
        requireCustomer(customer);
        return orderClient.getOrderHistory(customer.getCustomerId());
    }

    @GetMapping("/{orderNumber}")
    public OrderStatus getOrder(@PathVariable String orderNumber,
                                @CurrentCustomer CustomerContext customer) {
        String validatedOrderNumber = IdValidator.requireValidOrderNumber(orderNumber);
        requireCustomer(customer);
        OrderStatus order = orderClient.getOrderStatus(validatedOrderNumber);
        ownershipValidator.verifyOrderAccess(customer, customerIdFromOrder(order));
        return order;
    }

    @GetMapping("/{orderNumber}/tracking")
    public TrackingInfo getTracking(@PathVariable String orderNumber,
                                    @CurrentCustomer CustomerContext customer) {
        String validatedOrderNumber = IdValidator.requireValidOrderNumber(orderNumber);
        requireCustomer(customer);
        OrderStatus order = orderClient.getOrderStatus(validatedOrderNumber);
        ownershipValidator.verifyOrderAccess(customer, customerIdFromOrder(order));
        TrackingInfo tracking = shippingClient.getTracking(order.trackingNumber());
        return new TrackingInfo(tracking.trackingNumber(), tracking.carrier(), tracking.status(), tracking.lastUpdated());
    }

    private void requireCustomer(CustomerContext customer) {
        if (customer == null || customer.getCustomerId() == null || customer.getCustomerId().isBlank()) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
    }

    private String customerIdFromOrder(OrderStatus order) {
        if (order == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Order not found");
        }
        return order.customerId();
    }
}
