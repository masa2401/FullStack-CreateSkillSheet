package com.skillsheet.dto;

import java.util.List;

public record CategoryDto(
        Integer id,
        List<QuestionDto> questions) {
}