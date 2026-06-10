package com.skillsheet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skillsheet.entity.SheetAnswer;

public interface SheetAnswerRepository extends JpaRepository<SheetAnswer, Long> {
}