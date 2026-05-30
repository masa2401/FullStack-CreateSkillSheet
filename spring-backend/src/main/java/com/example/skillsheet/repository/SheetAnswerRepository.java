package com.example.skillsheet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.skillsheet.entity.SheetAnswer;

public interface SheetAnswerRepository extends JpaRepository<SheetAnswer, Long> {
}