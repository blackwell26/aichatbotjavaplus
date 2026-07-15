package com.company.chatbot.api;

import com.company.chatbot.common.enums.KnowledgeSourceType;
import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.knowledge.KnowledgeDocumentDetail;
import com.company.chatbot.knowledge.KnowledgeDocumentSummary;
import com.company.chatbot.knowledge.KnowledgeIngestionJob;
import com.company.chatbot.knowledge.KnowledgeIngestionResult;
import com.company.chatbot.knowledge.KnowledgeIngestionService;
import com.company.chatbot.persistence.postgres.KnowledgeDocumentRepository;
import com.company.chatbot.security.AuditLogService;
import com.company.chatbot.security.validation.IdValidator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/knowledge")
@Validated
@PreAuthorize("hasRole('ADMIN')")
@ConditionalOnBean(KnowledgeDocumentRepository.class)
public class AdminKnowledgeController {

    private final KnowledgeIngestionService ingestionService;
    private final AuditLogService auditLogService;

    public AdminKnowledgeController(KnowledgeIngestionService ingestionService,
                                    AuditLogService auditLogService) {
        this.ingestionService = ingestionService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/documents")
    public ResponseEntity<List<KnowledgeDocumentSummary>> listDocuments() {
        return ResponseEntity.ok(ingestionService.listDocuments());
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<KnowledgeDocumentDetail> getDocument(@PathVariable Long documentId) {
        return ResponseEntity.ok(ingestionService.getDocument(requirePositiveId(documentId, "documentId")));
    }

    @PostMapping(path = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<KnowledgeIngestionResult> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sourceType") KnowledgeSourceType sourceType,
            @CurrentCustomer CustomerContext customer) {

        KnowledgeIngestionResult result = ingestionService.upload(file, sourceType, actor(customer));
        auditLogService.logSensitiveAction(
                customer,
                "KNOWLEDGE_DOCUMENT_UPLOADED",
                "knowledge_document",
                String.valueOf(result.document().document().id()),
                Map.of("jobId", result.job().jobId(), "sourceType", sourceType.name())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping(path = "/documents/{documentId}/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<KnowledgeIngestionResult> replaceDocument(
            @PathVariable Long documentId,
            @RequestParam("file") MultipartFile file,
            @CurrentCustomer CustomerContext customer) {

        Long validatedDocumentId = requirePositiveId(documentId, "documentId");
        KnowledgeIngestionResult result = ingestionService.replace(validatedDocumentId, file, actor(customer));
        auditLogService.logSensitiveAction(
                customer,
                "KNOWLEDGE_DOCUMENT_REPLACED",
                "knowledge_document",
                String.valueOf(validatedDocumentId),
                Map.of("jobId", result.job().jobId(), "version", result.document().document().version())
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/ingestion/{jobId}")
    public ResponseEntity<KnowledgeIngestionJob> getIngestionJob(@PathVariable String jobId) {
        String validatedJobId = IdValidator.requireValidSessionId(jobId);
        return ResponseEntity.ok(ingestionService.getJob(validatedJobId));
    }

    private Long requirePositiveId(Long id, String name) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException(name + " must be a positive number");
        }
        return id;
    }

    private String actor(CustomerContext customer) {
        if (customer == null) {
            return "unknown";
        }
        if (customer.getUsername() != null && !customer.getUsername().isBlank()) {
            return customer.getUsername();
        }
        return customer.getCustomerId() != null ? customer.getCustomerId() : "unknown";
    }
}
