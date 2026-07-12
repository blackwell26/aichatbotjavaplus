package com.company.chatbot.security;

import com.company.chatbot.common.enums.UserRole;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.persistence.postgres.AuditLogRepository;
import com.company.chatbot.persistence.postgres.entity.AuditLogEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final RolePermissionEvaluator rolePermissionEvaluator;
    private AuditLogRepository auditLogRepository;

    public AuditLogService(RolePermissionEvaluator rolePermissionEvaluator) {
        this.rolePermissionEvaluator = rolePermissionEvaluator;
    }

    @Autowired(required = false)
    public void setAuditLogRepository(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logSensitiveAction(CustomerContext context, String action, String resourceType,
                                   String resourceId, Map<String, Object> details) {
        UserRole actorRole = rolePermissionEvaluator.resolvePrimaryRole(context);
        String actorId = context != null ? context.getCustomerId() : "anonymous";

        AuditLogEntity entity = new AuditLogEntity();
        entity.setActorId(actorId);
        entity.setActorRole(actorRole);
        entity.setAction(action);
        entity.setResourceType(resourceType);
        entity.setResourceId(resourceId);
        entity.setDetails(details == null ? Map.of() : new HashMap<>(details));

        if (auditLogRepository != null) {
            auditLogRepository.save(entity);
            return;
        }

        log.info("audit action={} actorId={} actorRole={} resourceType={} resourceId={} details={}",
                action, actorId, actorRole, resourceType, resourceId, entity.getDetails());
    }
}
