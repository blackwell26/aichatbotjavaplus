package com.company.chatbot.performance;

import com.company.chatbot.chat.ChatSession;
import com.company.chatbot.chat.ChatSessionService;
import com.company.chatbot.chat.MessageAppendResult;
import com.company.chatbot.chat.SubmitMessageRequest;
import com.company.chatbot.common.enums.ChatSessionStatus;
import com.company.chatbot.common.enums.IntentType;
import com.company.chatbot.common.enums.MessageSenderType;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.knowledge.KnowledgeEmbeddingGenerator;
import com.company.chatbot.persistence.mongo.ChatMessageDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatSessionDocumentRepository;
import com.company.chatbot.persistence.mongo.ChatSessionMapper;
import com.company.chatbot.persistence.mongo.ChatSessionDocument;
import com.company.chatbot.persistence.postgres.DocumentEmbeddingRepository;
import com.company.chatbot.persistence.postgres.KnowledgeChunkRepository;
import com.company.chatbot.persistence.postgres.entity.DocumentEmbeddingEntity;
import com.company.chatbot.persistence.redis.ChatSessionCacheRepository;
import com.company.chatbot.rag.RagOrchestrationService;
import com.company.chatbot.rag.RagPromptContext;
import com.company.chatbot.rag.RagRequest;
import com.company.chatbot.rag.RagRetrievalProperties;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class PerformanceValidationTest {

    @Test
    void ragPromptBuilding_scalesAcrossConcurrentRequests() throws Exception {
        DocumentEmbeddingRepository embeddingRepository = Mockito.mock(DocumentEmbeddingRepository.class);
        KnowledgeChunkRepository chunkRepository = Mockito.mock(KnowledgeChunkRepository.class);
        KnowledgeEmbeddingGenerator embeddingGenerator = text -> new float[] { 1.0f, 0.0f };

        RagRetrievalProperties properties = new RagRetrievalProperties();
        properties.setEnabled(true);
        properties.setTopK(1);
        properties.setSimilarityThreshold(0.1);
        properties.setMaxPromptCharacters(2_000);

        DocumentEmbeddingEntity embedding = new DocumentEmbeddingEntity();
        embedding.setEmbeddingId("emb-1");
        embedding.setDocumentId(1L);
        embedding.setChunkId(11L);
        embedding.setSourceTitle("faq");
        embedding.setVersion(1);
        embedding.setEmbeddingVector(new float[] { 1.0f, 0.0f });
        when(embeddingRepository.findAll()).thenReturn(List.of(embedding));

        var chunk = new com.company.chatbot.persistence.postgres.entity.KnowledgeChunkEntity();
        chunk.setId(11L);
        chunk.setDocumentId(1L);
        chunk.setSequence(1);
        chunk.setContent("FAQ content for concurrency validation.");
        chunk.setTokenCount(5);
        when(chunkRepository.findById(11L)).thenReturn(Optional.of(chunk));

        RagOrchestrationService service = new RagOrchestrationService(
                embeddingRepository,
                chunkRepository,
                embeddingGenerator,
                properties);

        CustomerContext customer = new CustomerContext(
                "cust-1",
                "customer@example.com",
                List.of("ROLE_CUSTOMER"),
                "en-US",
                Map.of());
        RagRequest request = new RagRequest(
                "What is your return policy?",
                customer,
                IntentType.FAQ,
                Map.of(),
                "Use only retrieved knowledge.");

        int concurrency = 16;
        try (var executor = Executors.newFixedThreadPool(concurrency)) {
            List<Callable<RagPromptContext>> jobs = java.util.stream.IntStream.range(0, 64)
                    .mapToObj(i -> (Callable<RagPromptContext>) () -> service.buildPromptContext(request))
                    .toList();

            List<RagPromptContext> results = executor.invokeAll(jobs).stream()
                    .map(future -> {
                        try {
                            return future.get(5, TimeUnit.SECONDS);
                        } catch (Exception ex) {
                            throw new IllegalStateException(ex);
                        }
                    })
                    .toList();

            assertThat(results).hasSize(64);
            assertThat(results).allSatisfy(result -> {
                assertThat(result.noResults()).isFalse();
                assertThat(result.prompt()).isNotBlank();
                assertThat(result.chunks()).hasSize(1);
            });
        }
    }

    @Test
    void chatSessionAppend_preservesSessionMetadataUnderConcurrentAccess() throws Exception {
        ChatSessionDocumentRepository sessionRepository = Mockito.mock(ChatSessionDocumentRepository.class);
        ChatMessageDocumentRepository messageRepository = Mockito.mock(ChatMessageDocumentRepository.class);
        ChatSessionCacheRepository cacheRepository = Mockito.mock(ChatSessionCacheRepository.class);

        AtomicInteger counter = new AtomicInteger();
        when(sessionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(messageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        ChatSessionDocument document = ChatSessionMapper.toDocument(new ChatSession(
                "session-1",
                "cust-1",
                ChatSessionStatus.OPEN,
                null,
                null,
                Instant.parse("2026-07-27T00:00:00Z"),
                Instant.parse("2026-07-27T00:00:00Z"),
                null,
                Map.of()));
        when(sessionRepository.findById("session-1")).thenReturn(Optional.of(document));
        when(cacheRepository.findBySessionId("session-1")).thenReturn(Optional.empty());

        ChatSessionService service = new ChatSessionService(sessionRepository, messageRepository);
        service.setSessionCacheRepository(cacheRepository);

        int concurrency = 8;
        try (var executor = Executors.newFixedThreadPool(concurrency)) {
            List<Callable<MessageAppendResult>> jobs = java.util.stream.IntStream.range(0, 32)
                    .mapToObj(i -> (Callable<MessageAppendResult>) () -> service.appendMessage(
                            SubmitMessageRequest.customerMessage(
                                    "session-1",
                                    "Concurrent message " + counter.incrementAndGet())))
                    .toList();

            List<MessageAppendResult> results = executor.invokeAll(jobs).stream()
                    .map(future -> {
                        try {
                            return future.get(5, TimeUnit.SECONDS);
                        } catch (Exception ex) {
                            throw new IllegalStateException(ex);
                        }
                    })
                    .toList();

            assertThat(results).hasSize(32);
            assertThat(results).allSatisfy(result -> {
                assertThat(result.getSession().getStatus()).isEqualTo(ChatSessionStatus.ACTIVE);
                assertThat(result.getMessage().getSenderType()).isEqualTo(MessageSenderType.CUSTOMER);
            });
        }
    }
}
