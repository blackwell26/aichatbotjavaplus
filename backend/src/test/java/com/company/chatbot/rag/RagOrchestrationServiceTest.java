package com.company.chatbot.rag;

import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.KnowledgeSourceType;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.knowledge.KnowledgeEmbeddingGenerator;
import com.company.chatbot.persistence.postgres.DocumentEmbeddingRepository;
import com.company.chatbot.persistence.postgres.KnowledgeChunkRepository;
import com.company.chatbot.persistence.postgres.entity.DocumentEmbeddingEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeChunkEntity;
import com.company.chatbot.persistence.redis.RagQueryCacheRepository;
import com.company.chatbot.persistence.redis.model.RagQueryCacheEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RagOrchestrationServiceTest {

    @Mock
    private DocumentEmbeddingRepository embeddingRepository;

    @Mock
    private KnowledgeChunkRepository chunkRepository;

    @Mock
    private RagQueryCacheRepository cacheRepository;

    private RagRetrievalProperties properties;
    private RagOrchestrationService service;
    private final TestEmbeddingGenerator embeddingGenerator = new TestEmbeddingGenerator();

    @BeforeEach
    void setUp() {
        properties = new RagRetrievalProperties();
        properties.setTopK(2);
        properties.setSimilarityThreshold(0.1);
        properties.setMaxPromptCharacters(2000);
        service = new RagOrchestrationService(embeddingRepository, chunkRepository, embeddingGenerator, properties);
    }

    @Test
    void buildPromptContext_retrievesAndRanksRelevantChunks() {
        seedEmbeddings(embedding("faq", 1L, 10L, 1, 1.0f, 0.0f),
                embedding("policy", 2L, 20L, 1, 0.8f, 0.2f),
                embedding("manual", 3L, 30L, 1, -1.0f, 0.0f));
        seedChunk(10L, 1, "FAQ answer about warranty coverage.");
        seedChunk(20L, 1, "Policy details about warranty return windows.");

        RagPromptContext context = service.buildPromptContext(request("warranty"));

        assertThat(context.noResults()).isFalse();
        assertThat(context.chunks()).extracting(RagRetrievedChunk::chunkId).containsExactly(10L, 20L);
        assertThat(context.citations()).hasSize(2);
        assertThat(context.prompt()).contains("Customer question:", "Retrieved knowledge:", "documentId=1");
    }

    @Test
    void buildPromptContext_appliesNoResultFallback() {
        seedEmbeddings(embedding("unrelated", 1L, 10L, 1, -1.0f, 0.0f));

        RagPromptContext context = service.buildPromptContext(request("warranty"));

        assertThat(context.noResults()).isTrue();
        assertThat(context.fallbackReason()).contains("No relevant knowledge chunks");
        assertThat(context.prompt()).contains("No relevant knowledge chunks were found");
    }

    @Test
    void buildPromptContext_usesCacheWhenScopeAndVersionMatch() {
        service.setCacheRepository(cacheRepository);
        seedEmbeddings(embedding("faq", 1L, 10L, 1, 1.0f, 0.0f));
        RagQueryCacheEntry cached = new RagQueryCacheEntry();
        cached.setQueryHash(expectedQueryHash("warranty", customer("cust-1"), "1:10:1"));
        cached.setAuthorizationScope("cust-1|ROLE_CUSTOMER");
        cached.setKnowledgeVersionHash(expectedVersionHash("1:10:1"));
        cached.setChunks(List.of(Map.of(
                "documentId", 1L,
                "chunkId", 10L,
                "sequence", 1,
                "content", "Cached warranty content",
                "citation", Map.of(
                        "documentId", 1L,
                        "chunkId", 10L,
                        "sourceTitle", "faq",
                        "sourceType", "FAQ",
                        "version", 1,
                        "similarity", 0.99
                )
        )));
        cached.setCitations(List.of(Map.of(
                "documentId", 1L,
                "chunkId", 10L,
                "sourceTitle", "faq",
                "sourceType", "FAQ",
                "version", 1,
                "similarity", 0.99
        )));
        when(cacheRepository.findByQueryHash(cached.getQueryHash())).thenReturn(Optional.of(cached));

        RagPromptContext context = service.buildPromptContext(request("warranty"));

        assertThat(context.cacheHit()).isTrue();
        assertThat(context.chunks()).extracting(RagRetrievedChunk::content).containsExactly("Cached warranty content");
        verify(chunkRepository, never()).findById(any());
    }

    @Test
    void buildPromptContext_ignoresCacheForDifferentAuthorizationScope() {
        service.setCacheRepository(cacheRepository);
        seedEmbeddings(embedding("faq", 1L, 10L, 1, 1.0f, 0.0f));
        seedChunk(10L, 1, "Fresh warranty content");
        RagQueryCacheEntry cached = new RagQueryCacheEntry();
        cached.setQueryHash(expectedQueryHash("warranty", customer("cust-1"), "1:10:1"));
        cached.setAuthorizationScope("other-customer|ROLE_CUSTOMER");
        cached.setKnowledgeVersionHash(expectedVersionHash("1:10:1"));
        when(cacheRepository.findByQueryHash(cached.getQueryHash())).thenReturn(Optional.of(cached));

        RagPromptContext context = service.buildPromptContext(request("warranty"));

        assertThat(context.cacheHit()).isFalse();
        assertThat(context.chunks()).extracting(RagRetrievedChunk::content).containsExactly("Fresh warranty content");
    }

    @Test
    void buildPromptContext_usesDifferentCacheKeyWhenKnowledgeVersionChanges() {
        service.setCacheRepository(cacheRepository);
        seedEmbeddings(embedding("faq", 1L, 10L, 2, 1.0f, 0.0f));
        seedChunk(10L, 1, "Updated warranty content");

        RagPromptContext context = service.buildPromptContext(request("warranty"));

        assertThat(context.queryHash()).isEqualTo(expectedQueryHash("warranty", customer("cust-1"), "1:10:2"));
        assertThat(context.chunks()).extracting(RagRetrievedChunk::content).containsExactly("Updated warranty content");
    }

    @Test
    void buildPromptContext_boundsPromptSize() {
        properties.setMaxPromptCharacters(300);
        seedEmbeddings(embedding("faq", 1L, 10L, 1, 1.0f, 0.0f));
        seedChunk(10L, 1, "Long content ".repeat(100));

        RagPromptContext context = service.buildPromptContext(request("warranty"));

        assertThat(context.prompt()).hasSizeLessThanOrEqualTo(300);
    }

    @Test
    void buildPromptContext_returnsFallbackWhenEmbeddingFails() {
        service = new RagOrchestrationService(embeddingRepository, chunkRepository, text -> {
            throw new IllegalStateException("vector search unavailable");
        }, properties);

        RagPromptContext context = service.buildPromptContext(request("warranty"));

        assertThat(context.fallbackReason()).contains("vector search unavailable");
        assertThat(context.noResults()).isTrue();
        assertThat(context.prompt()).contains("No relevant knowledge chunks were found");
    }

    private RagRequest request(String question) {
        return new RagRequest(
                question,
                customer("cust-1"),
                IntentType.FAQ,
                Map.of("orderStatus", "none"),
                "Use only supplied facts and retrieved chunks.");
    }

    private CustomerContext customer(String customerId) {
        return new CustomerContext(customerId, "customer@example.com", List.of("ROLE_CUSTOMER"), "en-US", Map.of());
    }

    private void seedEmbeddings(DocumentEmbeddingEntity... values) {
        when(embeddingRepository.findAll()).thenReturn(List.of(values));
    }

    private void seedChunk(Long chunkId, int sequence, String content) {
        KnowledgeChunkEntity chunk = new KnowledgeChunkEntity();
        chunk.setId(chunkId);
        chunk.setDocumentId(chunkId / 10);
        chunk.setSequence(sequence);
        chunk.setContent(content);
        chunk.setTokenCount(content.split("\\s+").length);
        when(chunkRepository.findById(chunkId)).thenReturn(Optional.of(chunk));
    }

    private DocumentEmbeddingEntity embedding(String title, Long documentId, Long chunkId, int version, float x, float y) {
        DocumentEmbeddingEntity entity = new DocumentEmbeddingEntity();
        entity.setEmbeddingId("emb-" + chunkId);
        entity.setDocumentId(documentId);
        entity.setChunkId(chunkId);
        entity.setSourceTitle(title);
        entity.setSourceType(KnowledgeSourceType.FAQ);
        entity.setVersion(version);
        entity.setDimension(2);
        entity.setEmbeddingVector(new float[] { x, y });
        return entity;
    }

    private String expectedVersionHash(String value) {
        return sha256(value);
    }

    private String expectedQueryHash(String question, CustomerContext customer, String versionValue) {
        String scope = customer.getCustomerId() + "|" + String.join(",", customer.getRoles());
        return sha256(question + "|" + scope + "|" + expectedVersionHash(versionValue));
    }

    private String sha256(String value) {
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static class TestEmbeddingGenerator implements KnowledgeEmbeddingGenerator {
        @Override
        public float[] embed(String text) {
            return new float[] { 1.0f, 0.0f };
        }
    }
}
