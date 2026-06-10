package com.skillsheet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skillsheet.entity.SheetCategory;

public interface SheetCategoryRepository extends JpaRepository<SheetCategory, Long> {
}