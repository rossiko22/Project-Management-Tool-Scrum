package com.example.scrumcoreservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoveBoardItemRequest {

    @NotNull(message = "Backlog item ID is required")
    private Long backlogItemId;

    @NotBlank(message = "Target column is required")
    private String targetColumn; // TO_DO, IN_PROGRESS, REVIEW, DONE
}
