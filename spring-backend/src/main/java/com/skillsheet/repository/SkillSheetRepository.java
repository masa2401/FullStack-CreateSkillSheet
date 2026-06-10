package com.skillsheet.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skillsheet.entity.SkillSheet;

public interface SkillSheetRepository extends JpaRepository<SkillSheet, UUID> {
    Optional<SkillSheet> findByShareToken(String shareToken);
}
