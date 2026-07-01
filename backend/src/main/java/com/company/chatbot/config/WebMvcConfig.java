package com.company.chatbot.config;

import com.company.chatbot.context.CurrentCustomerArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CurrentCustomerArgumentResolver currentCustomerArgumentResolver;

    public WebMvcConfig(CurrentCustomerArgumentResolver currentCustomerArgumentResolver) {
        this.currentCustomerArgumentResolver = currentCustomerArgumentResolver;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentCustomerArgumentResolver);
    }
}
