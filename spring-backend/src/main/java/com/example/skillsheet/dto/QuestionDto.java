package com.example.skillsheet.dto;

import java.util.List;

public record QuestionDto(
        Integer id,
        String questionText,
        List<AnswerDto> answers) {
}