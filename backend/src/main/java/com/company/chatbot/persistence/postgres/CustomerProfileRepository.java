package com.company.chatbot.persistence.postgres;

import com.company.chatbot.persistence.postgres.entity.CustomerProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerProfileRepository extends JpaRepository<CustomerProfileEntity, Long> {
}
