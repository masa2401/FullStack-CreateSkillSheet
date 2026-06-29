package com.skillsheet.dto;

import java.util.List;

public record QuestionDto(
        Integer questionId,
        List<AnswerDto> answers) {
}