package com.company.chatbot.context;

/**
 * Simple ThreadLocal holder for the resolved CustomerContext. Use carefully and ensure clear() is called.
 */
public final class CustomerContextHolder {
    private static final ThreadLocal<CustomerContext> CONTEXT = new ThreadLocal<>();

    private CustomerContextHolder() {}

    public static void set(CustomerContext ctx) {
        CONTEXT.set(ctx);
    }

    public static CustomerContext get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
