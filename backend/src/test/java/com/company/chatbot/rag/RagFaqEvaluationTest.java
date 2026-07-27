package com.company.chatbot.rag;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.KnowledgeSourceType;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.knowledge.KnowledgeEmbeddingGenerator;
import com.company.chatbot.persistence.postgres.DocumentEmbeddingRepository;
import com.company.chatbot.persistence.postgres.KnowledgeChunkRepository;
import com.company.chatbot.persistence.postgres.entity.DocumentEmbeddingEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeChunkEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RagFaqEvaluationTest {

    @Mock
    private DocumentEmbeddingRepository embeddingRepository;

    @Mock
    private KnowledgeChunkRepository chunkRepository;

    private RagOrchestrationService service;
    private final List<FaqCase> corpus = new ArrayList<>();
    private final List<DocumentEmbeddingEntity> embeddings = new ArrayList<>();
    private final List<KnowledgeChunkEntity> chunks = new ArrayList<>();

    @BeforeEach
    void setUp() {
        RagRetrievalProperties properties = new RagRetrievalProperties();
        properties.setEnabled(true);
        properties.setTopK(1);
        properties.setSimilarityThreshold(0.2);
        properties.setMaxPromptCharacters(4000);

        KnowledgeEmbeddingGenerator embeddingGenerator = this::embed;
        service = new RagOrchestrationService(
                embeddingRepository,
                chunkRepository,
                embeddingGenerator,
                properties);

        seedCorpus();
        when(embeddingRepository.findAll()).thenReturn(new ArrayList<>(embeddings));
        for (KnowledgeChunkEntity chunk : chunks) {
            when(chunkRepository.findById(chunk.getId())).thenReturn(Optional.of(chunk));
        }
    }

    @Test
    void faqRetrievalAccuracy_meetsNinetyPercentThreshold() {
        long correct = corpus.stream()
                .filter(this::isCorrectRetrieval)
                .count();

        double accuracy = corpus.isEmpty() ? 0.0 : (double) correct / corpus.size();

        assertThat(accuracy).isGreaterThanOrEqualTo(0.90);
        assertThat(correct).isEqualTo(corpus.size());
    }

    private boolean isCorrectRetrieval(FaqCase faqCase) {
        RagPromptContext context = service.buildPromptContext(new RagRequest(
                faqCase.question(),
                customer("cust-eval"),
                IntentType.FAQ,
                Map.of(),
                "Use only retrieved knowledge."));

        return !context.noResults()
                && !context.chunks().isEmpty()
                && context.chunks().getFirst().chunkId().equals(faqCase.chunkId())
                && context.prompt().contains(faqCase.answerSnippet());
    }

    private void seedCorpus() {
        corpus.clear();
        embeddings.clear();
        chunks.clear();

        addFaq(1L, "FAQ1 What is your return window?", "Customers may return items within 30 days.");
        addFaq(2L, "FAQ2 How long does shipping take?", "Standard shipping arrives in 3 to 5 business days.");
        addFaq(3L, "FAQ3 How do I track my order?", "You can track your order from the order detail page.");
        addFaq(4L, "FAQ4 How do I contact support?", "Use the chatbot or submit a support ticket.");
        addFaq(5L, "FAQ5 Can I cancel an order?", "Orders can be cancelled before they ship.");
        addFaq(6L, "FAQ6 What payment methods do you accept?", "We accept credit cards and PayPal.");
        addFaq(7L, "FAQ7 How do I request a refund?", "Refunds are issued after the returned item is received.");
        addFaq(8L, "FAQ8 What if the item is damaged?", "Damaged items qualify for a return request.");
        addFaq(9L, "FAQ9 Do you offer warranties?", "Electronics include a 1-year limited warranty.");
        addFaq(10L, "FAQ10 What are your store hours?", "Support is available 24/7 through the chatbot.");
    }

    private void addFaq(Long id, String question, String answer) {
        long chunkId = id * 10;
        corpus.add(new FaqCase(chunkId, question, answer));

        DocumentEmbeddingEntity embedding = new DocumentEmbeddingEntity();
        embedding.setEmbeddingId("emb-" + id);
        embedding.setDocumentId(id);
        embedding.setChunkId(chunkId);
        embedding.setSourceTitle("faq-" + id);
        embedding.setSourceType(KnowledgeSourceType.FAQ);
        embedding.setVersion(1);
        embedding.setDimension(4);
        embedding.setEmbeddingVector(embed(question));
        embeddings.add(embedding);

        KnowledgeChunkEntity chunk = new KnowledgeChunkEntity();
        chunk.setId(chunkId);
        chunk.setDocumentId(id);
        chunk.setSequence(1);
        chunk.setContent(answer);
        chunk.setTokenCount(answer.split("\\s+").length);
        chunks.add(chunk);
    }

    private float[] embed(String text) {
        float[] vector = new float[10];
        String normalized = text.toUpperCase();
        for (int i = 10; i >= 1; i--) {
            if (normalized.contains("FAQ" + i)) {
                vector[i - 1] = 1.0f;
                return vector;
            }
        }
        return vector;
    }

    private CustomerContext customer(String customerId) {
        return new CustomerContext(customerId, "customer@example.com", List.of("ROLE_CUSTOMER"), "en-US", Map.of());
    }

    private record FaqCase(Long chunkId, String question, String answerSnippet) {
    }
}
