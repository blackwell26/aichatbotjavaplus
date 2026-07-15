package com.company.chatbot.knowledge;

import com.company.chatbot.common.enums.KnowledgeSourceType;
import com.company.chatbot.persistence.postgres.DocumentEmbeddingRepository;
import com.company.chatbot.persistence.postgres.KnowledgeChunkRepository;
import com.company.chatbot.persistence.postgres.KnowledgeDocumentRepository;
import com.company.chatbot.persistence.postgres.entity.DocumentEmbeddingEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeChunkEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeDocumentEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.STRICT_STUBS)
class KnowledgeIngestionServiceTest {

    @Mock
    private KnowledgeDocumentRepository documentRepository;

    @Mock
    private KnowledgeChunkRepository chunkRepository;

    @Mock
    private DocumentEmbeddingRepository embeddingRepository;

    private KnowledgeIngestionService service;
    private final AtomicLong documentIds = new AtomicLong(10);
    private final AtomicLong chunkIds = new AtomicLong(100);
    private final List<KnowledgeDocumentEntity> documents = new ArrayList<>();
    private final List<KnowledgeChunkEntity> chunks = new ArrayList<>();
    private final List<DocumentEmbeddingEntity> embeddings = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new KnowledgeIngestionService(
                documentRepository,
                chunkRepository,
                embeddingRepository,
                new DeterministicKnowledgeEmbeddingGenerator());

        lenient().when(documentRepository.save(any(KnowledgeDocumentEntity.class))).thenAnswer(invocation -> {
            KnowledgeDocumentEntity entity = invocation.getArgument(0);
            if (entity.getId() == null) {
                entity.setId(documentIds.incrementAndGet());
                documents.add(entity);
            }
            return entity;
        });
        lenient().when(chunkRepository.save(any(KnowledgeChunkEntity.class))).thenAnswer(invocation -> {
            KnowledgeChunkEntity entity = invocation.getArgument(0);
            entity.setId(chunkIds.incrementAndGet());
            chunks.add(entity);
            return entity;
        });
        lenient().when(embeddingRepository.save(any(DocumentEmbeddingEntity.class))).thenAnswer(invocation -> {
            DocumentEmbeddingEntity entity = invocation.getArgument(0);
            embeddings.add(entity);
            return entity;
        });
        lenient().when(chunkRepository.findByDocumentIdOrderBySequenceAsc(any())).thenAnswer(invocation -> {
            Long documentId = invocation.getArgument(0);
            return chunks.stream()
                    .filter(chunk -> documentId.equals(chunk.getDocumentId()))
                    .toList();
        });
        lenient().when(embeddingRepository.findByDocumentId(any())).thenAnswer(invocation -> {
            Long documentId = invocation.getArgument(0);
            return embeddings.stream()
                    .filter(embedding -> documentId.equals(embedding.getDocumentId()))
                    .toList();
        });
    }

    @Test
    void upload_validTextDocument_persistsMetadataChunksAndEmbeddings() {
        MockMultipartFile file = textFile("returns.md", "Return policy\nItems may be returned within 30 days.");

        KnowledgeIngestionResult result = service.upload(file, KnowledgeSourceType.POLICY, "admin@example.com");

        assertThat(result.job().status()).isEqualTo(KnowledgeIngestionStatus.COMPLETED);
        assertThat(result.document().document().title()).isEqualTo("returns");
        assertThat(result.document().document().sourceType()).isEqualTo(KnowledgeSourceType.POLICY);
        assertThat(result.document().document().uploadedBy()).isEqualTo("admin@example.com");
        assertThat(result.document().chunks()).hasSize(1);
        assertThat(result.document().embeddingCount()).isEqualTo(1);
        assertThat(result.document().originalDocumentStorage())
                .isEqualTo(KnowledgeIngestionService.ORIGINAL_DOCUMENT_STORAGE);
        assertThat(embeddings.getFirst().getEmbeddingVector())
                .hasSize(DeterministicKnowledgeEmbeddingGenerator.DIMENSION);
    }

    @Test
    void upload_rejectsUnsupportedContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "script.exe",
                "application/octet-stream",
                "bad".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.upload(file, KnowledgeSourceType.FAQ, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unsupported content type");
    }

    @Test
    void replace_existingDocument_deletesOldChunksAndIncrementsVersion() {
        KnowledgeDocumentEntity existing = new KnowledgeDocumentEntity();
        existing.setId(42L);
        existing.setTitle("old-policy");
        existing.setSourceType(KnowledgeSourceType.POLICY);
        existing.setSource("old-policy.md");
        existing.setVersion(2);
        existing.setStatus("ACTIVE");
        when(documentRepository.findById(42L)).thenReturn(Optional.of(existing));

        KnowledgeIngestionResult result = service.replace(
                42L,
                textFile("new-policy.md", "Updated policy content."),
                "admin-2");

        verify(embeddingRepository).deleteByDocumentId(42L);
        verify(chunkRepository).deleteByDocumentId(42L);
        assertThat(result.document().document().title()).isEqualTo("new-policy");
        assertThat(result.document().document().version()).isEqualTo(3);
        assertThat(result.document().document().uploadedBy()).isEqualTo("admin-2");
    }

    @Test
    void getJob_unknownJob_throwsNotFound() {
        assertThatThrownBy(() -> service.getJob("missing-job"))
                .isInstanceOf(KnowledgeIngestionJobNotFoundException.class);
    }

    @Test
    void getDocument_missingDocument_throwsNotFound() {
        when(documentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getDocument(99L))
                .isInstanceOf(KnowledgeDocumentNotFoundException.class);
    }

    private MockMultipartFile textFile(String filename, String content) {
        return new MockMultipartFile(
                "file",
                filename,
                "text/markdown",
                content.getBytes(StandardCharsets.UTF_8));
    }
}
