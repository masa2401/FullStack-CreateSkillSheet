package com.example.skillsheet.dto;

import java.util.List;

public record CategoryDto(
        Integer id,
        String genre,
        String icon,
        List<QuestionDto> questions) {
}