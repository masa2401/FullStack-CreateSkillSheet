package com.skillsheet.dto.request;

import java.util.List;

import com.skillsheet.dto.CategoryDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SaveSheetRequest(
                @NotBlank @Size(max = 100) String userName,
                @NotNull @Size(max = 50) List<CategoryDto> categories) {
}
