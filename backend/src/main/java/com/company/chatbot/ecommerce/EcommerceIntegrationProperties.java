package com.company.chatbot.ecommerce;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConfigurationProperties(prefix = "integrations")
public class EcommerceIntegrationProperties {

    private final ServiceClientProperties productService = new ServiceClientProperties();
    private final ServiceClientProperties orderService = new ServiceClientProperties();
    private final ServiceClientProperties paymentService = new ServiceClientProperties();
    private final ServiceClientProperties shippingService = new ServiceClientProperties();
    private final ServiceClientProperties crmService = new ServiceClientProperties();

    public ServiceClientProperties getProductService() {
        return productService;
    }

    public ServiceClientProperties getOrderService() {
        return orderService;
    }

    public ServiceClientProperties getPaymentService() {
        return paymentService;
    }

    public ServiceClientProperties getShippingService() {
        return shippingService;
    }

    public ServiceClientProperties getCrmService() {
        return crmService;
    }

    public static class ServiceClientProperties {
        private boolean enabled = true;
        private String baseUrl = "http://localhost";
        private Duration timeout = Duration.ofSeconds(5);
        private String apiKey;
        private int maxAttempts = 2;
        private Duration retryBackoff = Duration.ofMillis(250);
        private float circuitBreakerFailureRateThreshold = 50.0f;
        private int circuitBreakerSlidingWindowSize = 10;
        private int circuitBreakerMinimumCalls = 5;
        private Duration circuitBreakerOpenDuration = Duration.ofSeconds(30);

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public Duration getTimeout() {
            return timeout;
        }

        public void setTimeout(Duration timeout) {
            this.timeout = timeout;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public Duration getRetryBackoff() {
            return retryBackoff;
        }

        public void setRetryBackoff(Duration retryBackoff) {
            this.retryBackoff = retryBackoff;
        }

        public float getCircuitBreakerFailureRateThreshold() {
            return circuitBreakerFailureRateThreshold;
        }

        public void setCircuitBreakerFailureRateThreshold(float circuitBreakerFailureRateThreshold) {
            this.circuitBreakerFailureRateThreshold = circuitBreakerFailureRateThreshold;
        }

        public int getCircuitBreakerSlidingWindowSize() {
            return circuitBreakerSlidingWindowSize;
        }

        public void setCircuitBreakerSlidingWindowSize(int circuitBreakerSlidingWindowSize) {
            this.circuitBreakerSlidingWindowSize = circuitBreakerSlidingWindowSize;
        }

        public int getCircuitBreakerMinimumCalls() {
            return circuitBreakerMinimumCalls;
        }

        public void setCircuitBreakerMinimumCalls(int circuitBreakerMinimumCalls) {
            this.circuitBreakerMinimumCalls = circuitBreakerMinimumCalls;
        }

        public Duration getCircuitBreakerOpenDuration() {
            return circuitBreakerOpenDuration;
        }

        public void setCircuitBreakerOpenDuration(Duration circuitBreakerOpenDuration) {
            this.circuitBreakerOpenDuration = circuitBreakerOpenDuration;
        }
    }
}
