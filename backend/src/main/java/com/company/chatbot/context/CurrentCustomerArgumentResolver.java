package com.company.chatbot.context;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class CurrentCustomerArgumentResolver implements HandlerMethodArgumentResolver {

    private final CustomerContextResolver resolver;

    public CurrentCustomerArgumentResolver(CustomerContextResolver resolver) {
        this.resolver = resolver;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentCustomer.class)
                || CustomerContext.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, org.springframework.web.bind.support.WebDataBinderFactory binderFactory) throws Exception {
        CustomerContext ctx = resolver.resolve();
        // Return null if no context (controller can handle null or mark param as @Nullable)
        return ctx;
    }
}
