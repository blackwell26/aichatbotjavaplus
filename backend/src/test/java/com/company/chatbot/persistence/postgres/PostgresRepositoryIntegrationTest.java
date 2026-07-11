package com.company.chatbot.persistence.postgres;

import com.company.chatbot.common.enums.ConfidenceLevel;
import com.company.chatbot.common.enums.EscalationStatus;
import com.company.chatbot.common.enums.EscalationTrigger;
import com.company.chatbot.common.enums.KnowledgeSourceType;
import com.company.chatbot.common.enums.RefundRequestStatus;
import com.company.chatbot.common.enums.TicketStatus;
import com.company.chatbot.common.enums.UserRole;
import com.company.chatbot.config.JpaConfig;
import com.company.chatbot.persistence.postgres.entity.AnalyticsSnapshotEntity;
import com.company.chatbot.persistence.postgres.entity.AuditLogEntity;
import com.company.chatbot.persistence.postgres.entity.CustomerEntity;
import com.company.chatbot.persistence.postgres.entity.CustomerProfileEntity;
import com.company.chatbot.persistence.postgres.entity.DocumentEmbeddingEntity;
import com.company.chatbot.persistence.postgres.entity.EscalationEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeChunkEntity;
import com.company.chatbot.persistence.postgres.entity.KnowledgeDocumentEntity;
import com.company.chatbot.persistence.postgres.entity.RefundRequestEntity;
import com.company.chatbot.persistence.postgres.entity.SupportTicketEntity;
import com.company.chatbot.persistence.postgres.entity.TicketCommentEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@Import(JpaConfig.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
@EnabledIf("com.company.chatbot.persistence.postgres.support.DockerConditions#dockerAvailable")
class PostgresRepositoryIntegrationTest {

    private static final DockerImageName PGVECTOR_IMAGE =
            DockerImageName.parse("pgvector/pgvector:pg15").asCompatibleSubstituteFor("postgres");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(PGVECTOR_IMAGE);

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("persistence.postgres.enabled", () -> "true");
    }

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private TicketCommentRepository ticketCommentRepository;

    @Autowired
    private EscalationRepository escalationRepository;

    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;

    @Autowired
    private KnowledgeChunkRepository knowledgeChunkRepository;

    @Autowired
    private DocumentEmbeddingRepository documentEmbeddingRepository;

    @Autowired
    private RefundRequestRepository refundRequestRepository;

    @Autowired
    private AnalyticsSnapshotRepository analyticsSnapshotRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void persistsOperationalEntities() {
        CustomerEntity customer = new CustomerEntity();
        customer.setExternalId(UUID.randomUUID());
        customer.setEmail("customer@example.com");
        customer = customerRepository.save(customer);

        CustomerProfileEntity profile = new CustomerProfileEntity();
        profile.setCustomer(customer);
        profile.setDisplayName("Test Customer");
        profile.setLocale("en-US");
        profile.setTimezone("UTC");
        profile.setPreferences(Map.of("newsletter", true));
        customerProfileRepository.save(profile);

        SupportTicketEntity ticket = new SupportTicketEntity();
        ticket.setCustomerId(customer.getId());
        ticket.setSubject("Order issue");
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setPriority("HIGH");
        ticket = supportTicketRepository.save(ticket);

        TicketCommentEntity comment = new TicketCommentEntity();
        comment.setTicketId(ticket.getId());
        comment.setAuthorId("agent-1");
        comment.setAuthorRole(UserRole.AGENT);
        comment.setContent("We are reviewing your order.");
        ticketCommentRepository.save(comment);

        EscalationEntity escalation = new EscalationEntity();
        escalation.setSessionId("session-123");
        escalation.setCustomerId(customer.getExternalId().toString());
        escalation.setTrigger(EscalationTrigger.LOW_CONFIDENCE);
        escalation.setStatus(EscalationStatus.PENDING);
        escalation.setAiConfidenceLevel(ConfidenceLevel.LOW);
        escalation.setAiConfidenceScore(0.3);
        escalation.setTicketId(ticket.getId());
        escalationRepository.save(escalation);

        KnowledgeDocumentEntity document = new KnowledgeDocumentEntity();
        document.setTitle("Return Policy");
        document.setSourceType(KnowledgeSourceType.POLICY);
        document.setSource("policy.pdf");
        document.setUploadedBy("admin");
        document = knowledgeDocumentRepository.save(document);

        KnowledgeChunkEntity chunk = new KnowledgeChunkEntity();
        chunk.setDocumentId(document.getId());
        chunk.setSequence(1);
        chunk.setContent("Returns accepted within 30 days.");
        chunk.setTokenCount(8);
        chunk = knowledgeChunkRepository.save(chunk);

        DocumentEmbeddingEntity embedding = new DocumentEmbeddingEntity();
        embedding.setEmbeddingId("emb-1");
        embedding.setDocumentId(document.getId());
        embedding.setChunkId(chunk.getId());
        embedding.setEmbeddingVector(zeroVector(1536));
        embedding.setSourceTitle(document.getTitle());
        embedding.setSourceType(KnowledgeSourceType.POLICY);
        documentEmbeddingRepository.save(embedding);

        RefundRequestEntity refund = new RefundRequestEntity();
        refund.setOrderNumber("ORD-1001");
        refund.setCustomerId(customer.getExternalId().toString());
        refund.setReason("Damaged item");
        refund.setAmount(new BigDecimal("49.99"));
        refund.setStatus(RefundRequestStatus.PENDING);
        refund.setEligibilitySnapshot(Map.of("eligible", true));
        refundRequestRepository.save(refund);

        Instant periodStart = Instant.parse("2026-07-01T00:00:00Z");
        AnalyticsSnapshotEntity snapshot = new AnalyticsSnapshotEntity();
        snapshot.setPeriodStart(periodStart);
        snapshot.setPeriodEnd(Instant.parse("2026-07-02T00:00:00Z"));
        snapshot.setChatVolume(42);
        snapshot.setAvgResponseTimeMs(1200);
        snapshot.setEscalationRate(0.05);
        analyticsSnapshotRepository.save(snapshot);

        AuditLogEntity auditLog = new AuditLogEntity();
        auditLog.setActorId("admin-1");
        auditLog.setActorRole(UserRole.ADMIN);
        auditLog.setAction("KNOWLEDGE_UPLOAD");
        auditLog.setResourceType("knowledge_document");
        auditLog.setResourceId(document.getId().toString());
        auditLog.setCorrelationId("corr-1");
        auditLog.setDetails(Map.of("title", document.getTitle()));
        auditLogRepository.save(auditLog);

        assertTrue(customerRepository.findByExternalId(customer.getExternalId()).isPresent());
        assertEquals(1, supportTicketRepository.findByCustomerId(customer.getId()).size());
        assertEquals(1, ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).size());
        assertFalse(escalationRepository.findBySessionId("session-123").isEmpty());
        assertEquals(1, knowledgeChunkRepository.findByDocumentIdOrderBySequenceAsc(document.getId()).size());
        assertTrue(documentEmbeddingRepository.findByEmbeddingId("emb-1").isPresent());
        assertTrue(refundRequestRepository.findByOrderNumber("ORD-1001").isPresent());
        assertEquals(1, analyticsSnapshotRepository.findByRecordedAtBetween(
                periodStart.minusSeconds(1), periodStart.plusSeconds(86_400)).size());
        assertEquals(1, auditLogRepository.findByActorId("admin-1").size());
    }

    private static float[] zeroVector(int dimension) {
        return new float[dimension];
    }
}
