package com.example.caro.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record MoveDto(
        @JsonAlias({"rowIdx", "r"})
        @NotNull(message = "Thiếu dòng của nước đi") @Min(value = 0, message = "Dòng phải từ 0 đến 9") @Max(value = 9, message = "Dòng phải từ 0 đến 9")
        Integer row,

        @JsonAlias({"colIdx", "c"})
        @NotNull(message = "Thiếu cột của nước đi") @Min(value = 0, message = "Cột phải từ 0 đến 9") @Max(value = 9, message = "Cột phải từ 0 đến 9")
        Integer col,

        @NotNull(message = "Thiếu quân cờ") @Pattern(regexp = "^[XO]$", message = "Quân cờ phải là X hoặc O")
        String symbol) {
}

