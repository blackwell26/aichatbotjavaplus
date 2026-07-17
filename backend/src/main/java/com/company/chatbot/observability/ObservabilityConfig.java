package com.company.chatbot.observability;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.jvm.ClassLoaderMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmGcMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmHeapPressureMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmMemoryMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmThreadMetrics;
import io.micrometer.core.instrument.binder.system.FileDescriptorMetrics;
import io.micrometer.core.instrument.binder.system.ProcessorMetrics;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ObservabilityConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> meterRegistryCustomizer() {
        return registry -> registry.config().commonTags("application", "aichatbotjava");
    }

    @Bean
    public io.micrometer.core.instrument.binder.MeterBinder jvmMetricsBinder() {
        return registry -> {
            new ClassLoaderMetrics().bindTo(registry);
            new JvmMemoryMetrics().bindTo(registry);
            new JvmGcMetrics().bindTo(registry);
            new JvmHeapPressureMetrics().bindTo(registry);
            new JvmThreadMetrics().bindTo(registry);
            new ProcessorMetrics().bindTo(registry);
            new FileDescriptorMetrics().bindTo(registry);
        };
    }
}
