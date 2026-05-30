package com.example.skillsheet.dto.request;

import java.util.List;
import com.example.skillsheet.dto.CategoryDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveSheetRequest(
        @NotBlank String userName,
        @NotNull List<CategoryDto> categories) {
}
