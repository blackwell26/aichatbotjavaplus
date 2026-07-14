package com.company.chatbot.intent;

import com.company.chatbot.common.enums.IntentType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Deterministic, rule-based intent classifier.
 *
 * <p>Applies a prioritised list of compiled patterns and keyword sets to the
 * normalised (lower-case) message text.  Each rule either matches or does not;
 * there is no probabilistic scoring here — a match always yields a fixed
 * high-confidence score defined in {@link IntentClassificationProperties}.</p>
 *
 * <h3>Rule precedence (first match wins)</h3>
 * <ol>
 *   <li>Escalation — explicit requests to speak to a human agent.</li>
 *   <li>Order status — messages containing an order-number pattern.</li>
 *   <li>Refund request — refund / return / money-back keywords.</li>
 *   <li>Shipping inquiry — shipping / delivery / tracking keywords.</li>
 *   <li>Payment issue — payment / charge / billing keywords.</li>
 *   <li>Account issue — account / login / password / profile keywords.</li>
 *   <li>Product inquiry — product / price / availability / stock keywords.</li>
 * </ol>
 *
 * <p>If none of the rules match, {@link Optional#empty()} is returned and the
 * caller (the hybrid classifier) falls through to the Ollama path.</p>
 */
@Component
public class DeterministicIntentClassifier {

    // -----------------------------------------------------------------------
    // Order-number pattern — common e-commerce formats:
    //   ORD-12345, ORDER#98765, #ORD1234567, plain numeric strings 6-12 digits
    // -----------------------------------------------------------------------
    private static final Pattern ORDER_NUMBER_PATTERN = Pattern.compile(
            "(?:ord(?:er)?[-#]?\\s*\\d{4,12}|#\\d{5,12}|\\b\\d{8,12}\\b)",
            Pattern.CASE_INSENSITIVE
    );

    // -----------------------------------------------------------------------
    // Escalation phrases — customer requesting a human agent
    // -----------------------------------------------------------------------
    private static final List<String> ESCALATION_PHRASES = List.of(
            "speak to a human",
            "talk to a human",
            "speak to an agent",
            "talk to an agent",
            "speak to a person",
            "talk to a person",
            "talk to someone",
            "speak to someone",
            "connect me to support",
            "transfer me to",
            "escalate",
            "supervisor",
            "manager",
            "real person",
            "live agent",
            "human support"
    );

    // -----------------------------------------------------------------------
    // Keyword lists for other intents (all lower-case)
    // -----------------------------------------------------------------------
    private static final List<String> REFUND_KEYWORDS = List.of(
            "refund", "return", "money back", "get my money", "cancel order",
            "cancel my order", "cancel", "send it back", "exchange",
            "reimbursement", "chargeback"
    );

    private static final List<String> SHIPPING_KEYWORDS = List.of(
            "shipping", "shipment", "delivery", "deliver", "track", "tracking",
            "where is my order", "where is my package", "package", "courier",
            "carrier", "estimated arrival", "eta", "dispatch", "dispatched"
    );

    private static final List<String> PAYMENT_KEYWORDS = List.of(
            "payment", "charge", "charged", "billing", "bill", "invoice",
            "transaction", "credit card", "debit card", "paypal", "pay",
            "overcharged", "double charge", "declined", "payment failed",
            "payment issue", "payment problem"
    );

    private static final List<String> ACCOUNT_KEYWORDS = List.of(
            "account", "login", "log in", "sign in", "password", "reset password",
            "forgot password", "username", "profile", "email address", "email change",
            "update account", "delete account", "close account", "subscription"
    );

    private static final List<String> PRODUCT_KEYWORDS = List.of(
            "product", "item", "price", "pricing", "cost", "how much", "available",
            "availability", "in stock", "out of stock", "stock", "buy", "purchase",
            "specification", "spec", "feature", "model", "size", "color", "colour",
            "category", "brand", "warranty"
    );

    private final IntentClassificationProperties properties;

    public DeterministicIntentClassifier(IntentClassificationProperties properties) {
        this.properties = properties;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Attempt to classify {@code message} using deterministic rules.
     *
     * @param message the raw customer message (any case)
     * @return a matched {@link IntentClassification} or {@link Optional#empty()} when
     *         no rule fires
     */
    public Optional<IntentClassification> classify(String message) {
        if (message == null || message.isBlank()) {
            return Optional.empty();
        }

        String lower = message.toLowerCase();

        // 1. Escalation — highest priority
        if (matchesAny(lower, ESCALATION_PHRASES)) {
            return Optional.of(ruleResult(IntentType.ESCALATION_REQUEST));
        }

        // 2. Order status — order-number pattern (very specific)
        if (ORDER_NUMBER_PATTERN.matcher(lower).find()) {
            return Optional.of(ruleResult(IntentType.ORDER_STATUS));
        }

        // 3. Refund request
        if (matchesAny(lower, REFUND_KEYWORDS)) {
            return Optional.of(ruleResult(IntentType.REFUND_REQUEST));
        }

        // 4. Shipping inquiry
        if (matchesAny(lower, SHIPPING_KEYWORDS)) {
            return Optional.of(ruleResult(IntentType.SHIPPING_INQUIRY));
        }

        // 5. Payment issue
        if (matchesAny(lower, PAYMENT_KEYWORDS)) {
            return Optional.of(ruleResult(IntentType.PAYMENT_ISSUE));
        }

        // 6. Account issue
        if (matchesAny(lower, ACCOUNT_KEYWORDS)) {
            return Optional.of(ruleResult(IntentType.ACCOUNT_ISSUE));
        }

        // 7. Product inquiry
        if (matchesAny(lower, PRODUCT_KEYWORDS)) {
            return Optional.of(ruleResult(IntentType.PRODUCT_INQUIRY));
        }

        return Optional.empty();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private boolean matchesAny(String lower, List<String> keywords) {
        for (String kw : keywords) {
            if (lower.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private IntentClassification ruleResult(IntentType intentType) {
        return new IntentClassification(
                intentType,
                com.company.chatbot.common.enums.ConfidenceLevel.fromScore(properties.getRuleConfidenceScore()),
                properties.getRuleConfidenceScore(),
                null,
                true,
                null,
                java.time.Instant.now()
        );
    }
}
