package com.example.skillsheet.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.skillsheet.entity.SkillSheet;
import java.util.Optional;

public interface SkillSheetRepository extends JpaRepository<SkillSheet, UUID> {
    Optional<SkillSheet> findByShareToken(String shareToken);
}
