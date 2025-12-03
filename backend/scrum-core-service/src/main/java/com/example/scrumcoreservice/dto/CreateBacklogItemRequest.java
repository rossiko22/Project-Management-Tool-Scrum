package com.example.scrumcoreservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateBacklogItemRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Type is required")
    private String type; // STORY, EPIC, BUG, TECHNICAL_TASK

    private Integer storyPoints;
    private Integer priority;
    private String acceptanceCriteria;
}
