package com.skillsheet.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sheet_categories")
@Getter
@Setter
@NoArgsConstructor

public class SheetCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sheet_id", nullable = false)
    private SkillSheet skillSheet;

    private Integer categoryId;
    private String genre;
    private String icon;

    @OneToMany(mappedBy = "sheetCategory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SheetAnswer> answers = new ArrayList<>();
}
