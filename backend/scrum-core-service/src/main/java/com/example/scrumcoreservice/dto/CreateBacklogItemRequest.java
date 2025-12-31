package com.example.scrumcoreservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

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

    // Optional: Status can be BACKLOG or SPRINT_READY
    // If not provided, defaults to BACKLOG
    private String status;

    // Optional: Sprint to add the item to (only for SPRINT_READY status)
    // Must be a sprint in PLANNED state
    private Long sprintId;

    // Required when status is SPRINT_READY and sprintId is provided
    // List of all team member IDs who need to approve this item
    // (Product Owner + all Developers in the sprint's team)
    private List<Long> assignedDeveloperIds;
}
