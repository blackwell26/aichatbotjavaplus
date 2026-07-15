package com.company.chatbot.knowledge;

import com.company.chatbot.common.enums.KnowledgeSourceType;
import com.company.chatbot.persistence.postgres.DocumentEmbeddingRepository;
import com.company.chatbot.persistence.postgres.KnowledgeChunkRepository;
import com.company.chatbot.persistence.postgres.KnowledgeDocumentRepository;
import com.company.chatbot.persistence.postgres.entity.DocumentEmbeddingEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeChunkEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeDocumentEntity;
import com.company.chatbot.security.validation.FileUploadValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnBean(KnowledgeDocumentRepository.class)
public class KnowledgeIngestionService {

    static final String ORIGINAL_DOCUMENT_STORAGE = "discarded_after_text_extraction";
    private static final int MAX_CHUNK_CHARS = 1200;
    private static final int CHUNK_OVERLAP_CHARS = 150;

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final DocumentEmbeddingRepository embeddingRepository;
    private final KnowledgeEmbeddingGenerator embeddingGenerator;
    private final Map<String, KnowledgeIngestionJob> jobs = new ConcurrentHashMap<>();
    private ApplicationEventPublisher eventPublisher;

    public KnowledgeIngestionService(KnowledgeDocumentRepository documentRepository,
                                     KnowledgeChunkRepository chunkRepository,
                                     DocumentEmbeddingRepository embeddingRepository,
                                     KnowledgeEmbeddingGenerator embeddingGenerator) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingGenerator = embeddingGenerator;
    }

    @Autowired(required = false)
    public void setEventPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<KnowledgeDocumentSummary> listDocuments() {
        return documentRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public KnowledgeDocumentDetail getDocument(Long documentId) {
        KnowledgeDocumentEntity document = documentRepository.findById(documentId)
                .orElseThrow(() -> new KnowledgeDocumentNotFoundException(documentId));
        return toDetail(document);
    }

    @Transactional(readOnly = true)
    public KnowledgeIngestionJob getJob(String jobId) {
        KnowledgeIngestionJob job = jobs.get(jobId);
        if (job == null) {
            throw new KnowledgeIngestionJobNotFoundException(jobId);
        }
        return job;
    }

    @Transactional
    public KnowledgeIngestionResult upload(MultipartFile file, KnowledgeSourceType sourceType, String uploadedBy) {
        String jobId = UUID.randomUUID().toString();
        jobs.put(jobId, KnowledgeIngestionJob.accepted(jobId));

        try {
            FileUploadValidator.validate(file.getOriginalFilename(), file.getContentType(), file.getSize());
            String text = extractText(file);
            KnowledgeDocumentEntity document = createDocument(file, sourceType, uploadedBy);
            KnowledgeDocumentDetail detail = ingestText(document, text);
            KnowledgeIngestionJob completed = jobs.get(jobId)
                    .completed(document.getId(), "Knowledge document ingested");
            jobs.put(jobId, completed);
            publishIngestedEvent(document, completed);
            return new KnowledgeIngestionResult(completed, detail);
        } catch (RuntimeException ex) {
            jobs.computeIfPresent(jobId, (ignored, job) -> job.failed(ex.getMessage()));
            throw ex;
        } catch (IOException ex) {
            jobs.computeIfPresent(jobId, (ignored, job) -> job.failed("Unable to read uploaded document"));
            throw new IllegalArgumentException("Unable to read uploaded document", ex);
        }
    }

    @Transactional
    public KnowledgeIngestionResult replace(Long documentId, MultipartFile file, String uploadedBy) {
        String jobId = UUID.randomUUID().toString();
        jobs.put(jobId, KnowledgeIngestionJob.accepted(jobId));

        try {
            FileUploadValidator.validate(file.getOriginalFilename(), file.getContentType(), file.getSize());
            KnowledgeDocumentEntity document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new KnowledgeDocumentNotFoundException(documentId));
            String text = extractText(file);

            embeddingRepository.deleteByDocumentId(documentId);
            chunkRepository.deleteByDocumentId(documentId);

            document.setTitle(resolveTitle(file.getOriginalFilename()));
            document.setSource(file.getOriginalFilename());
            document.setUploadedBy(uploadedBy);
            document.setVersion(document.getVersion() + 1);
            document.setStatus("ACTIVE");
            document = documentRepository.save(document);

            KnowledgeDocumentDetail detail = ingestText(document, text);
            KnowledgeIngestionJob completed = jobs.get(jobId)
                    .completed(document.getId(), "Knowledge document replaced and ingested");
            jobs.put(jobId, completed);
            publishIngestedEvent(document, completed);
            return new KnowledgeIngestionResult(completed, detail);
        } catch (RuntimeException ex) {
            jobs.computeIfPresent(jobId, (ignored, job) -> job.failed(ex.getMessage()));
            throw ex;
        } catch (IOException ex) {
            jobs.computeIfPresent(jobId, (ignored, job) -> job.failed("Unable to read uploaded document"));
            throw new IllegalArgumentException("Unable to read uploaded document", ex);
        }
    }

    private KnowledgeDocumentEntity createDocument(MultipartFile file, KnowledgeSourceType sourceType, String uploadedBy) {
        KnowledgeDocumentEntity document = new KnowledgeDocumentEntity();
        document.setTitle(resolveTitle(file.getOriginalFilename()));
        document.setSourceType(sourceType);
        document.setSource(file.getOriginalFilename());
        document.setUploadedBy(uploadedBy);
        document.setVersion(1);
        document.setStatus("ACTIVE");
        return documentRepository.save(document);
    }

    private KnowledgeDocumentDetail ingestText(KnowledgeDocumentEntity document, String text) {
        List<String> chunks = chunk(text);
        for (int i = 0; i < chunks.size(); i++) {
            KnowledgeChunkEntity chunk = new KnowledgeChunkEntity();
            chunk.setDocumentId(document.getId());
            chunk.setSequence(i + 1);
            chunk.setContent(chunks.get(i));
            chunk.setTokenCount(estimateTokenCount(chunks.get(i)));
            chunk = chunkRepository.save(chunk);

            DocumentEmbeddingEntity embedding = new DocumentEmbeddingEntity();
            embedding.setEmbeddingId(UUID.randomUUID().toString());
            embedding.setDocumentId(document.getId());
            embedding.setChunkId(chunk.getId());
            embedding.setEmbeddingVector(embeddingGenerator.embed(chunk.getContent()));
            embedding.setSourceTitle(document.getTitle());
            embedding.setSourceType(document.getSourceType());
            embedding.setVersion(document.getVersion());
            embedding.setDimension(DeterministicKnowledgeEmbeddingGenerator.DIMENSION);
            embeddingRepository.save(embedding);
        }
        return toDetail(document);
    }

    private String extractText(MultipartFile file) throws IOException {
        String text = new String(file.getBytes(), StandardCharsets.UTF_8).trim();
        if (text.isBlank()) {
            throw new IllegalArgumentException("uploaded document contains no extractable text");
        }
        return text;
    }

    private List<String> chunk(String text) {
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(text.length(), start + MAX_CHUNK_CHARS);
            if (end < text.length()) {
                int boundary = Math.max(text.lastIndexOf("\n", end), text.lastIndexOf(". ", end));
                if (boundary > start + 200) {
                    end = boundary + 1;
                }
            }
            chunks.add(text.substring(start, end).trim());
            if (end == text.length()) {
                break;
            }
            start = Math.max(end - CHUNK_OVERLAP_CHARS, start + 1);
        }
        return chunks;
    }

    private int estimateTokenCount(String content) {
        return Math.max(1, content.trim().split("\\s+").length);
    }

    private String resolveTitle(String filename) {
        String value = filename == null || filename.isBlank() ? "Untitled knowledge document" : filename.trim();
        int dot = value.lastIndexOf('.');
        return dot > 0 ? value.substring(0, dot) : value;
    }

    private KnowledgeDocumentDetail toDetail(KnowledgeDocumentEntity document) {
        List<KnowledgeChunkSummary> chunks = chunkRepository.findByDocumentIdOrderBySequenceAsc(document.getId())
                .stream()
                .map(chunk -> new KnowledgeChunkSummary(
                        chunk.getId(),
                        chunk.getSequence(),
                        chunk.getContent(),
                        chunk.getTokenCount()))
                .toList();

        int embeddingCount = embeddingRepository.findByDocumentId(document.getId()).size();
        return new KnowledgeDocumentDetail(toSummary(document), chunks, embeddingCount, ORIGINAL_DOCUMENT_STORAGE);
    }

    private KnowledgeDocumentSummary toSummary(KnowledgeDocumentEntity document) {
        return new KnowledgeDocumentSummary(
                document.getId(),
                document.getTitle(),
                document.getSourceType(),
                document.getSource(),
                document.getVersion(),
                document.getStatus(),
                document.getUploadedBy(),
                document.getCreatedAt(),
                document.getUpdatedAt());
    }

    private void publishIngestedEvent(KnowledgeDocumentEntity document, KnowledgeIngestionJob job) {
        if (eventPublisher == null) {
            return;
        }
        eventPublisher.publishEvent(new KnowledgeDocumentIngestedEvent(
                "knowledge.document.ingested",
                document.getId(),
                document.getVersion(),
                document.getSourceType(),
                job.jobId(),
                job.updatedAt()));
    }
}
