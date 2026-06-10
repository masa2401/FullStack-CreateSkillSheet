package com.skillsheet.dto;

import java.util.List;

public record QuestionDto(
                Integer id,
                String questionText,
                List<AnswerDto> answers) {
}