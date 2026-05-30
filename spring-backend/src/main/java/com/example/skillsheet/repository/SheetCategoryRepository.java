package com.example.skillsheet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.skillsheet.entity.SheetCategory;

public interface SheetCategoryRepository extends JpaRepository<SheetCategory, Long> {
}