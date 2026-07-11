package com.company.chatbot.persistence.postgres;

import com.company.chatbot.common.enums.RefundRequestStatus;
import com.company.chatbot.common.enums.TicketStatus;
import com.company.chatbot.common.enums.UserRole;
import com.company.chatbot.persistence.postgres.entity.AuditLogEntity;
import com.company.chatbot.persistence.postgres.entity.CustomerEntity;
import com.company.chatbot.persistence.postgres.entity.CustomerProfileEntity;
import com.company.chatbot.persistence.postgres.entity.RefundRequestEntity;
import com.company.chatbot.persistence.postgres.entity.SupportTicketEntity;
import com.company.chatbot.persistence.postgres.entity.TicketCommentEntity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@Import(PostgresRepositoryH2IntegrationTest.H2JpaConfig.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:chatbot_repo;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "persistence.postgres.enabled=true"
})
class PostgresRepositoryH2IntegrationTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private TicketCommentRepository ticketCommentRepository;

    @Autowired
    private RefundRequestRepository refundRequestRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void persistsCoreOperationalEntities() {
        CustomerEntity customer = new CustomerEntity();
        customer.setExternalId(UUID.randomUUID());
        customer.setEmail("h2@example.com");
        customer = customerRepository.save(customer);

        CustomerProfileEntity profile = new CustomerProfileEntity();
        profile.setCustomer(customer);
        profile.setDisplayName("H2 Customer");
        profile.setLocale("en-US");
        profile.setPreferences(Map.of("channel", "web"));
        customerProfileRepository.save(profile);

        SupportTicketEntity ticket = new SupportTicketEntity();
        ticket.setCustomerId(customer.getId());
        ticket.setSubject("Help");
        ticket.setStatus(TicketStatus.OPEN);
        ticket = supportTicketRepository.save(ticket);

        TicketCommentEntity comment = new TicketCommentEntity();
        comment.setTicketId(ticket.getId());
        comment.setAuthorId("agent-2");
        comment.setAuthorRole(UserRole.AGENT);
        comment.setContent("Acknowledged.");
        ticketCommentRepository.save(comment);

        RefundRequestEntity refund = new RefundRequestEntity();
        refund.setOrderNumber("ORD-2002");
        refund.setCustomerId(customer.getExternalId().toString());
        refund.setAmount(new BigDecimal("10.00"));
        refund.setStatus(RefundRequestStatus.PENDING);
        refundRequestRepository.save(refund);

        AuditLogEntity auditLog = new AuditLogEntity();
        auditLog.setActorId("system");
        auditLog.setActorRole(UserRole.SYSTEM);
        auditLog.setAction("REFUND_CREATE");
        auditLog.setResourceType("refund_request");
        auditLog.setResourceId("ORD-2002");
        auditLogRepository.save(auditLog);

        assertTrue(customerRepository.findByExternalId(customer.getExternalId()).isPresent());
        assertEquals(1, supportTicketRepository.findByCustomerId(customer.getId()).size());
        assertTrue(refundRequestRepository.findByOrderNumber("ORD-2002").isPresent());
        assertEquals(1, auditLogRepository.findByActorId("system").size());
    }

    @Configuration
    @EnableJpaRepositories(basePackages = "com.company.chatbot.persistence.postgres")
    @EntityScan(basePackageClasses = {
            CustomerEntity.class,
            CustomerProfileEntity.class,
            SupportTicketEntity.class,
            TicketCommentEntity.class,
            RefundRequestEntity.class,
            AuditLogEntity.class
    })
    static class H2JpaConfig {
    }
}
