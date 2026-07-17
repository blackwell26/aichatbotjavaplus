package com.company.chatbot.ecommerce.client;

import com.company.chatbot.ecommerce.EcommerceIntegrationProperties;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.slf4j.MDC;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.UUID;
import java.util.function.Supplier;

@ConditionalOnBean(RestClient.Builder.class)
abstract class AbstractEcommerceClient {

    protected final RestClient restClient;
    private final Retry retry;
    private final CircuitBreaker circuitBreaker;

    protected AbstractEcommerceClient(RestClient restClient) {
        this.restClient = restClient;
        this.retry = null;
        this.circuitBreaker = null;
    }

    protected AbstractEcommerceClient(RestClient.Builder builder,
                                       EcommerceIntegrationProperties.ServiceClientProperties properties) {
        this.restClient = builder
                .requestFactory(createRequestFactory(properties.getTimeout()))
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .requestInterceptor((request, body, execution) -> {
                    if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
                        request.getHeaders().setBearerAuth(properties.getApiKey());
                    }
                    String correlationId = MDC.get("correlationId");
                    if (correlationId == null || correlationId.isBlank()) {
                        correlationId = MDC.get("traceId");
                    }
                    if (correlationId == null || correlationId.isBlank()) {
                        correlationId = UUID.randomUUID().toString();
                    }
                    request.getHeaders().set("X-Correlation-Id", correlationId);
                    return execution.execute(request, body);
                })
                .build();
        this.retry = Retry.of("ecommerce-" + properties.getBaseUrl(), RetryConfig.custom()
                .maxAttempts(Math.max(1, properties.getMaxAttempts()))
                .waitDuration(properties.getRetryBackoff())
                .retryExceptions(RuntimeException.class)
                .build());
        this.circuitBreaker = CircuitBreaker.of("ecommerce-" + properties.getBaseUrl(), CircuitBreakerConfig.custom()
                .failureRateThreshold(properties.getCircuitBreakerFailureRateThreshold())
                .slidingWindowSize(properties.getCircuitBreakerSlidingWindowSize())
                .minimumNumberOfCalls(properties.getCircuitBreakerMinimumCalls())
                .waitDurationInOpenState(properties.getCircuitBreakerOpenDuration())
                .build());
    }

    protected <T> T get(String path, Class<T> responseType) {
        return execute(() -> restClient.get().uri(path).retrieve().body(responseType));
    }

    protected <T> T post(String path, Object body, Class<T> responseType) {
        return execute(() -> restClient.post().uri(path).contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(responseType));
    }

    private <T> T execute(Supplier<T> supplier) {
        if (retry == null || circuitBreaker == null) {
            return supplier.get();
        }
        return Retry.decorateSupplier(retry, CircuitBreaker.decorateSupplier(circuitBreaker, supplier)).get();
    }

    private SimpleClientHttpRequestFactory createRequestFactory(Duration timeout) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        if (timeout != null) {
            int timeoutMs = Math.toIntExact(timeout.toMillis());
            factory.setConnectTimeout(timeoutMs);
            factory.setReadTimeout(timeoutMs);
        }
        return factory;
    }
}
