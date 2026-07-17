package com.company.chatbot.ecommerce.client;

import com.company.chatbot.ecommerce.EcommerceIntegrationProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class EcommerceClientTest {

    @Test
    void productClient_usesConfiguredEndpoints() {
        RestClient.Builder builder = restClientBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ProductClient client = new ProductClient(builder.build());

        server.expect(once(), requestTo("http://example.test/api/v1/products/SKU-1"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {"productId":"SKU-1","name":"Widget","description":"Desc","price":12.5,"currency":"USD","availableQuantity":7,"attributes":{"color":"blue"}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.getProduct("SKU-1").name()).isEqualTo("Widget");
        server.verify();
    }

    @Test
    void orderClient_usesConfiguredEndpoints() {
        RestClient.Builder builder = restClientBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OrderClient client = new OrderClient(builder.build());

        server.expect(once(), requestTo("http://example.test/api/v1/orders/ORD-1"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {"orderNumber":"ORD-1","status":"SHIPPED","trackingNumber":"TRK-1","currency":"USD","total":19.99}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.getOrderStatus("ORD-1").status()).isEqualTo("SHIPPED");
        server.verify();
    }

    @Test
    void paymentClient_usesConfiguredEndpoints() {
        RestClient.Builder builder = restClientBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        PaymentClient client = new PaymentClient(builder.build());

        server.expect(once(), requestTo("http://example.test/api/v1/payments/PAY-1/verification"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {"paymentId":"PAY-1","verified":true,"status":"VERIFIED","details":{"provider":"stripe"}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.verifyPayment("PAY-1").verified()).isTrue();
        server.verify();
    }

    @Test
    void shippingClient_usesConfiguredEndpoints() {
        RestClient.Builder builder = restClientBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ShippingClient client = new ShippingClient(builder.build());

        server.expect(once(), requestTo("http://example.test/api/v1/shipments/TRK-1"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {"trackingNumber":"TRK-1","carrier":"UPS","status":"IN_TRANSIT","lastUpdated":"2026-07-16T10:00:00Z"}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.getTracking("TRK-1").carrier()).isEqualTo("UPS");
        server.verify();
    }

    @Test
    void crmClient_usesConfiguredEndpoints() {
        RestClient.Builder builder = restClientBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        CrmClient client = new CrmClient(builder.build());

        server.expect(once(), requestTo("http://example.test/api/v1/customers/CUST-1"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {"customerId":"CUST-1","displayName":"Jane","email":"jane@example.com","locale":"en-US"}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.getCustomerProfile("CUST-1").displayName()).isEqualTo("Jane");
        server.verify();
    }

    private RestClient.Builder restClientBuilder() {
        return RestClient.builder().baseUrl("http://example.test");
    }

}
