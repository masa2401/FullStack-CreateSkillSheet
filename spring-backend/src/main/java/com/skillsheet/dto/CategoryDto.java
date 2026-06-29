package com.skillsheet.dto;

import java.util.List;

public record CategoryDto(
        Integer categoryId,
        List<QuestionDto> questions) {
}