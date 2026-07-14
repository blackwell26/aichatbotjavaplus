package com.company.chatbot.intent;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.IntentType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the full intent classification pipeline.
 *
 * <p>Tests are organised into four nested classes:</p>
 * <ul>
 *   <li>{@link DeterministicClassifierTests} – rule-based classifier in isolation.</li>
 *   <li>{@link OllamaClassifierTests} – JSON response parsing and error handling.</li>
 *   <li>{@link HybridServiceTests} – hybrid service combining rules + Ollama.</li>
 *   <li>{@link EdgeCaseTests} – null, blank, disabled, and exception paths.</li>
 * </ul>
 *
 * <p>No Spring context is started — all dependencies are mocked with Mockito.</p>
 */
@ExtendWith(MockitoExtension.class)
class IntentClassificationServiceTest {

    // -----------------------------------------------------------------------
    // Shared helpers
    // -----------------------------------------------------------------------

    private IntentClassificationProperties defaultProperties() {
        IntentClassificationProperties props = new IntentClassificationProperties();
        props.setEnabled(true);
        props.setModel("llama2");
        props.setRuleConfidenceScore(0.95);
        props.setMinimumConfidenceThreshold(0.5);
        props.setMaxMessageLength(1000);
        return props;
    }

    // =======================================================================
    // DeterministicIntentClassifier unit tests
    // =======================================================================

    @Nested
    class DeterministicClassifierTests {

        private DeterministicIntentClassifier classifier;

        @BeforeEach
        void setUp() {
            classifier = new DeterministicIntentClassifier(defaultProperties());
        }

        // --- ESCALATION_REQUEST ---

        @ParameterizedTest(name = "escalation phrase: {0}")
        @ValueSource(strings = {
                "I want to speak to a human",
                "I need to talk to an agent",
                "Please connect me to a real person",
                "Transfer me to a supervisor",
                "Can I have a live agent please?",
                "I want to escalate this issue"
        })
        void escalationPhrases_returnEscalationIntent(String message) {
            Optional<IntentClassification> result = classifier.classify(message);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.ESCALATION_REQUEST);
            assertThat(result.get().isRuleMatched()).isTrue();
            assertThat(result.get().getConfidenceScore()).isEqualTo(0.95);
        }

        // --- ORDER_STATUS ---

        @ParameterizedTest(name = "order number pattern: {0}")
        @ValueSource(strings = {
                "What is the status of order ORD-12345?",
                "Track my order#98765432",
                "Where is my order ord-654321?",
                "I need to check on 123456789",
                "Update on ORDER-9876543210"
        })
        void orderNumberPattern_returnsOrderStatusIntent(String message) {
            Optional<IntentClassification> result = classifier.classify(message);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.ORDER_STATUS);
            assertThat(result.get().isRuleMatched()).isTrue();
        }

        // --- REFUND_REQUEST ---

        @ParameterizedTest(name = "refund keyword: {0}")
        @ValueSource(strings = {
                "I want a refund for my purchase",
                "How do I return this item?",
                "I need my money back",
                "Please cancel my order",
                "I want to exchange this product",
                "Process a chargeback for this transaction"
        })
        void refundKeywords_returnRefundIntent(String message) {
            Optional<IntentClassification> result = classifier.classify(message);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.REFUND_REQUEST);
        }

        // --- SHIPPING_INQUIRY ---

        @ParameterizedTest(name = "shipping keyword: {0}")
        @ValueSource(strings = {
                "How long will shipping take?",
                "When will my delivery arrive?",
                "Can I get a tracking number?",
                "Where is my package?",
                "What carrier are you using?",
                "What is the estimated arrival date?"
        })
        void shippingKeywords_returnShippingIntent(String message) {
            Optional<IntentClassification> result = classifier.classify(message);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.SHIPPING_INQUIRY);
        }

        // --- PAYMENT_ISSUE ---

        @ParameterizedTest(name = "payment keyword: {0}")
        @ValueSource(strings = {
                "I was charged twice",
                "My payment failed",
                "I have a billing question",
                "Why was my credit card declined?",
                "There is an issue with my invoice",
                "I see an unexpected charge on my PayPal"
        })
        void paymentKeywords_returnPaymentIssueIntent(String message) {
            Optional<IntentClassification> result = classifier.classify(message);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.PAYMENT_ISSUE);
        }

        // --- ACCOUNT_ISSUE ---

        @ParameterizedTest(name = "account keyword: {0}")
        @ValueSource(strings = {
                "I can't log in to my account",
                "How do I reset my password?",
                "I forgot my username",
                "Please update my email address",
                "I want to delete my account",
                "How do I manage my subscription?"
        })
        void accountKeywords_returnAccountIssueIntent(String message) {
            Optional<IntentClassification> result = classifier.classify(message);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.ACCOUNT_ISSUE);
        }

        // --- PRODUCT_INQUIRY ---

        @ParameterizedTest(name = "product keyword: {0}")
        @ValueSource(strings = {
                "How much does this product cost?",
                "Is item A in stock?",
                "What are the specifications of model X?",
                "What colors is this available in?",
                "Is this covered by a warranty?"
        })
        void productKeywords_returnProductInquiryIntent(String message) {
            Optional<IntentClassification> result = classifier.classify(message);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.PRODUCT_INQUIRY);
        }

        // --- No match ---

        @ParameterizedTest(name = "no rule match: {0}")
        @ValueSource(strings = {
                "Hello there",
                "Hi, I have a question",
                "Thank you for your help"
        })
        void messageWithNoMatchingKeywords_returnsEmpty(String message) {
            Optional<IntentClassification> result = classifier.classify(message);
            assertThat(result).isEmpty();
        }

        @Test
        void nullMessage_returnsEmpty() {
            assertThat(classifier.classify(null)).isEmpty();
        }

        @Test
        void blankMessage_returnsEmpty() {
            assertThat(classifier.classify("   ")).isEmpty();
        }

        // --- Escalation beats everything else ---

        @Test
        void escalationPhraseOverridesOrderNumberInSameMessage() {
            // Contains both an order number and an escalation phrase
            Optional<IntentClassification> result =
                    classifier.classify("I want to speak to a manager about order ORD-12345");

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.ESCALATION_REQUEST);
        }

        // --- Confidence and metadata ---

        @Test
        void ruleMatch_setsRuleMatchedTrueAndNullModelLabel() {
            Optional<IntentClassification> result = classifier.classify("I want a refund");

            assertThat(result).isPresent();
            IntentClassification ic = result.get();
            assertThat(ic.isRuleMatched()).isTrue();
            assertThat(ic.getModelLabel()).isNull();
            assertThat(ic.getFallbackReason()).isNull();
            assertThat(ic.getConfidenceLevel()).isEqualTo(ConfidenceLevel.HIGH);
        }
    }

    // =======================================================================
    // OllamaIntentClassifier unit tests  (parseResponse path tested directly)
    // =======================================================================

    @Nested
    class OllamaClassifierTests {

        private OllamaIntentClassifier classifier;

        @BeforeEach
        void setUp() {
            // We test parseResponse directly — no ChatClient needed for these tests.
            // For tests that exercise classify(), we use a Mockito mock.
            classifier = new OllamaIntentClassifier(
                    mock(ChatClient.Builder.class, RETURNS_DEEP_STUBS),
                    new ObjectMapper(),
                    defaultProperties()
            );
        }

        @Test
        void parseResponse_validJson_returnsClassification() {
            Optional<IntentClassification> result =
                    classifier.parseResponse("{\"intent\":\"ORDER_STATUS\",\"confidence\":0.87}");

            assertThat(result).isPresent();
            IntentClassification ic = result.get();
            assertThat(ic.getIntentType()).isEqualTo(IntentType.ORDER_STATUS);
            assertThat(ic.getConfidenceScore()).isEqualTo(0.87);
            assertThat(ic.isRuleMatched()).isFalse();
            assertThat(ic.getModelLabel()).isEqualTo("llama2");
        }

        @Test
        void parseResponse_unknownIntent_defaultsToUnknown() {
            Optional<IntentClassification> result =
                    classifier.parseResponse("{\"intent\":\"DOES_NOT_EXIST\",\"confidence\":0.9}");

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.UNKNOWN);
        }

        @Test
        void parseResponse_allSupportedIntents() {
            for (IntentType type : IntentType.values()) {
                String json = String.format("{\"intent\":\"%s\",\"confidence\":0.8}", type.name());
                Optional<IntentClassification> result = classifier.parseResponse(json);
                assertThat(result).isPresent();
                assertThat(result.get().getIntentType()).isEqualTo(type);
            }
        }

        @Test
        void parseResponse_jsonWithMarkdownFences_extractsCorrectly() {
            String raw = "```json\n{\"intent\":\"REFUND_REQUEST\",\"confidence\":0.91}\n```";
            Optional<IntentClassification> result = classifier.parseResponse(raw);

            assertThat(result).isPresent();
            assertThat(result.get().getIntentType()).isEqualTo(IntentType.REFUND_REQUEST);
        }

        @Test
        void parseResponse_confidenceClamped_aboveOne() {
            Optional<IntentClassification> result =
                    classifier.parseResponse("{\"intent\":\"FAQ\",\"confidence\":1.5}");

            assertThat(result).isPresent();
            assertThat(result.get().getConfidenceScore()).isEqualTo(1.0);
        }

        @Test
        void parseResponse_confidenceClamped_belowZero() {
            Optional<IntentClassification> result =
                    classifier.parseResponse("{\"intent\":\"FAQ\",\"confidence\":-0.2}");

            assertThat(result).isPresent();
            assertThat(result.get().getConfidenceScore()).isEqualTo(0.0);
        }

        @Test
        void parseResponse_invalidJson_returnsEmpty() {
            Optional<IntentClassification> result = classifier.parseResponse("not json at all");
            assertThat(result).isEmpty();
        }

        @Test
        void parseResponse_null_returnsEmpty() {
            assertThat(classifier.parseResponse(null)).isEmpty();
        }

        @Test
        void parseResponse_emptyString_returnsEmpty() {
            assertThat(classifier.parseResponse("")).isEmpty();
        }
    }

    // =======================================================================
    // IntentClassificationService (hybrid) unit tests
    // =======================================================================

    @Nested
    class HybridServiceTests {

        @Mock
        private DeterministicIntentClassifier ruleClassifier;

        @Mock
        private OllamaIntentClassifier ollamaClassifier;

        private IntentClassificationProperties properties;
        private IntentClassificationService service;

        @BeforeEach
        void setUp() {
            properties = defaultProperties();
            service = new IntentClassificationService(ruleClassifier, ollamaClassifier, properties);
        }

        // --- Rule takes priority ---

        @Test
        void whenRuleMatches_returnsRuleResult_ollamaNotCalled() {
            IntentClassification ruleResult = IntentClassification.of(IntentType.ESCALATION_REQUEST, 0.95, true);
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.of(ruleResult));

            IntentClassification result = service.classify("speak to a manager");

            assertThat(result.getIntentType()).isEqualTo(IntentType.ESCALATION_REQUEST);
            assertThat(result.isRuleMatched()).isTrue();
            verify(ollamaClassifier, never()).classify(anyString());
        }

        // --- Ollama path when no rule matches ---

        @Test
        void whenNoRuleMatches_ollamaResultAboveThreshold_returnsOllamaResult() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification ollamaResult = new IntentClassification(
                    IntentType.FAQ, ConfidenceLevel.HIGH, 0.82, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(ollamaResult));

            IntentClassification result = service.classify("How does your return policy work?");

            assertThat(result.getIntentType()).isEqualTo(IntentType.FAQ);
            assertThat(result.getConfidenceScore()).isEqualTo(0.82);
            assertThat(result.isRuleMatched()).isFalse();
        }

        // --- Low-confidence fallback ---

        @Test
        void whenOllamaScoreBelowThreshold_returnsUnknownWithFallbackReason() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification lowConfResult = new IntentClassification(
                    IntentType.PRODUCT_INQUIRY, ConfidenceLevel.LOW, 0.30, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(lowConfResult));

            IntentClassification result = service.classify("some ambiguous message");

            assertThat(result.getIntentType()).isEqualTo(IntentType.UNKNOWN);
            assertThat(result.getConfidenceLevel()).isEqualTo(ConfidenceLevel.LOW);
            assertThat(result.getFallbackReason()).isNotBlank();
            assertThat(result.getFallbackReason()).contains("threshold");
        }

        @Test
        void whenOllamaScoreExactlyAtThreshold_accepts() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification borderResult = new IntentClassification(
                    IntentType.SHIPPING_INQUIRY, ConfidenceLevel.MEDIUM, 0.50, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(borderResult));

            IntentClassification result = service.classify("When will it arrive?");

            // score == threshold is treated as above-threshold (exclusive lower bound)
            assertThat(result.getIntentType()).isEqualTo(IntentType.SHIPPING_INQUIRY);
        }

        // --- Ollama unavailable ---

        @Test
        void whenOllamaUnavailable_returnsUnknownFallback() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.empty());

            IntentClassification result = service.classify("Tell me something");

            assertThat(result.getIntentType()).isEqualTo(IntentType.UNKNOWN);
            assertThat(result.getConfidenceLevel()).isEqualTo(ConfidenceLevel.LOW);
            assertThat(result.getFallbackReason()).isNotBlank();
        }

        @Test
        void whenOllamaThrows_returnsUnknownFallback_doesNotPropagate() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            when(ollamaClassifier.classify(anyString())).thenThrow(new RuntimeException("connection refused"));

            assertThatNoException().isThrownBy(() -> {
                IntentClassification result = service.classify("Some message");
                assertThat(result.getIntentType()).isEqualTo(IntentType.UNKNOWN);
            });
        }

        // --- Classification disabled ---

        @Test
        void whenClassificationDisabled_returnsUnknownImmediately_neitherClassifierCalled() {
            properties.setEnabled(false);

            IntentClassification result = service.classify("I want a refund");

            assertThat(result.getIntentType()).isEqualTo(IntentType.UNKNOWN);
            assertThat(result.getFallbackReason()).containsIgnoringCase("disabled");
            verify(ruleClassifier, never()).classify(anyString());
            verify(ollamaClassifier, never()).classify(anyString());
        }

        // --- Each intent type covered end-to-end via mock ---

        @Test
        void productInquiry_viaRule() {
            IntentClassification ruleResult = IntentClassification.of(IntentType.PRODUCT_INQUIRY, 0.95, true);
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.of(ruleResult));

            IntentClassification result = service.classify("Is item X in stock?");
            assertThat(result.getIntentType()).isEqualTo(IntentType.PRODUCT_INQUIRY);
        }

        @Test
        void orderStatus_viaRule() {
            IntentClassification ruleResult = IntentClassification.of(IntentType.ORDER_STATUS, 0.95, true);
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.of(ruleResult));

            IntentClassification result = service.classify("ORD-12345 status?");
            assertThat(result.getIntentType()).isEqualTo(IntentType.ORDER_STATUS);
        }

        @Test
        void refundRequest_viaOllama() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification ollamaResult = new IntentClassification(
                    IntentType.REFUND_REQUEST, ConfidenceLevel.HIGH, 0.88, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(ollamaResult));

            IntentClassification result = service.classify("I would like to get my money back please");
            assertThat(result.getIntentType()).isEqualTo(IntentType.REFUND_REQUEST);
        }

        @Test
        void shippingInquiry_viaOllama() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification ollamaResult = new IntentClassification(
                    IntentType.SHIPPING_INQUIRY, ConfidenceLevel.MEDIUM, 0.72, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(ollamaResult));

            IntentClassification result = service.classify("When will my stuff arrive?");
            assertThat(result.getIntentType()).isEqualTo(IntentType.SHIPPING_INQUIRY);
        }

        @Test
        void paymentIssue_viaOllama() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification ollamaResult = new IntentClassification(
                    IntentType.PAYMENT_ISSUE, ConfidenceLevel.HIGH, 0.91, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(ollamaResult));

            IntentClassification result = service.classify("I can't complete checkout");
            assertThat(result.getIntentType()).isEqualTo(IntentType.PAYMENT_ISSUE);
        }

        @Test
        void accountIssue_viaOllama() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification ollamaResult = new IntentClassification(
                    IntentType.ACCOUNT_ISSUE, ConfidenceLevel.HIGH, 0.85, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(ollamaResult));

            IntentClassification result = service.classify("I'm locked out");
            assertThat(result.getIntentType()).isEqualTo(IntentType.ACCOUNT_ISSUE);
        }

        @Test
        void faq_viaOllama() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            IntentClassification ollamaResult = new IntentClassification(
                    IntentType.FAQ, ConfidenceLevel.MEDIUM, 0.68, null, false, "llama2", null);
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.of(ollamaResult));

            IntentClassification result = service.classify("What are your opening hours?");
            assertThat(result.getIntentType()).isEqualTo(IntentType.FAQ);
        }

        @Test
        void escalationRequest_viaRule() {
            IntentClassification ruleResult = IntentClassification.of(IntentType.ESCALATION_REQUEST, 0.95, true);
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.of(ruleResult));

            IntentClassification result = service.classify("I demand to speak to a manager right now");
            assertThat(result.getIntentType()).isEqualTo(IntentType.ESCALATION_REQUEST);
        }

        @Test
        void unknown_whenNeitherClassifierMatches() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.empty());

            IntentClassification result = service.classify("Hmm");
            assertThat(result.getIntentType()).isEqualTo(IntentType.UNKNOWN);
        }
    }

    // =======================================================================
    // Edge cases
    // =======================================================================

    @Nested
    class EdgeCaseTests {

        @Mock
        private DeterministicIntentClassifier ruleClassifier;

        @Mock
        private OllamaIntentClassifier ollamaClassifier;

        private IntentClassificationService service;

        @BeforeEach
        void setUp() {
            service = new IntentClassificationService(ruleClassifier, ollamaClassifier, defaultProperties());
        }

        @Test
        void nullMessage_returnsUnknownWithFallback() {
            IntentClassification result = service.classify(null);

            assertThat(result.getIntentType()).isEqualTo(IntentType.UNKNOWN);
            assertThat(result.getFallbackReason()).isNotBlank();
            verify(ruleClassifier, never()).classify(any());
            verify(ollamaClassifier, never()).classify(any());
        }

        @Test
        void blankMessage_returnsUnknownWithFallback() {
            IntentClassification result = service.classify("   ");

            assertThat(result.getIntentType()).isEqualTo(IntentType.UNKNOWN);
            assertThat(result.getFallbackReason()).isNotBlank();
        }

        @Test
        void classifyNeverThrows() {
            when(ruleClassifier.classify(anyString())).thenThrow(new RuntimeException("unexpected"));

            assertThatNoException().isThrownBy(() -> service.classify("any message"));
        }

        @Test
        void resultAlwaysHasConfidenceLevelSet() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.empty());

            IntentClassification result = service.classify("anything");

            assertThat(result.getConfidenceLevel()).isNotNull();
        }

        @Test
        void resultAlwaysHasClassifiedAtSet() {
            when(ruleClassifier.classify(anyString())).thenReturn(Optional.empty());
            when(ollamaClassifier.classify(anyString())).thenReturn(Optional.empty());

            IntentClassification result = service.classify("anything");

            assertThat(result.getClassifiedAt()).isNotNull();
        }
    }
}
